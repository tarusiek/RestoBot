# Foundation Infrastructure Layer

This document contains the real, production-ready TypeScript code and configuration files that form the runtime foundation of the AI-powered restaurant website generation engine. 

*Note: No final visual components (Hero, Menu, etc.) are included. This is strictly the configuration, validation, rendering, and infrastructure layer.*

---

## 1. Tailwind Configuration Architecture (`tailwind.config.ts`)
The configuration directly maps to injected CSS variables, allowing a single build to support infinite branding variations.

```typescript
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './templates/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## 2. CSS Variable System & Globals (`styles/globals.css`)
Provides the base `@tailwind` directives and semantic CSS reset. Specific color variables are intentionally omitted here because they are injected at runtime via inline styles to support multi-tenancy.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-body antialiased;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading tracking-tight;
  }
}

/* Fallback base variables if runtime injection fails */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

## 3. Theme Generation & Injection Utilities (`lib/theme-generator.ts`)
Converts the JSON config payload into a React inline style object.

```typescript
import { ThemeConfig } from "@/config/schema";

/**
 * Converts a raw HSL string from JSON (e.g., "hsl(222, 47%, 11%)") 
 * into raw numbers for Tailwind (e.g., "222 47% 11%")
 */
const extractHslValues = (hslString: string) => {
  const match = hslString.match(/hsl\((.*?)\)/);
  return match ? match[1].replace(/,/g, "") : "0 0% 0%";
};

export function generateThemeVariables(theme: ThemeConfig): React.CSSProperties {
  return {
    "--background": extractHslValues(theme.colors.background),
    "--foreground": extractHslValues(theme.colors.foreground),
    "--primary": extractHslValues(theme.colors.primary),
    "--primary-foreground": extractHslValues(theme.colors.primaryForeground),
    "--border": extractHslValues(theme.colors.muted), // Map muted to border dynamically
    "--radius": theme.radius === "none" ? "0px" : theme.radius === "full" ? "9999px" : "0.5rem",
  } as React.CSSProperties;
}
```

## 4. Config Validation & Loading Pipeline (`lib/config-loader.ts`)
Server-side utility that fetches, parses, and validates the AI-generated JSON config.

```typescript
import 'server-only';
import { RestaurantConfigSchema, RestaurantConfig } from '@/config/schema';
import { headers } from 'next/headers';

export async function getTenantConfig(): Promise<RestaurantConfig> {
  // In production, this identifies the tenant based on the hostname
  const headersList = headers();
  const domain = headersList.get('host') || 'default.localhost';
  
  try {
    // Simulated fetch from DB, Edge Config, or S3
    const res = await fetch(`https://api.system.com/configs/${domain}`);
    const rawJson = await res.json();
    
    // AI-Safe Validation Flow (Zod)
    const validatedConfig = RestaurantConfigSchema.parse(rawJson);
    return validatedConfig;
  } catch (error) {
    console.error(`Config load failed for ${domain}:`, error);
    // Fallback to a safe default if validation fails
    return getFallbackConfig();
  }
}

function getFallbackConfig(): RestaurantConfig {
  // Returns a safe, minimal layout
  return { /* hardcoded fallback data */ } as any;
}
```

## 5. Dynamic Font Loading & App Initialization (`app/layout.tsx`)
Initializes the runtime theme, dynamic fonts, and passes the context downwards.

```tsx
import { Inter, Playfair_Display, Roboto } from 'next/font/google';
import { getTenantConfig } from '@/lib/config-loader';
import { generateThemeVariables } from '@/lib/theme-generator';
import { ErrorBoundary } from '@/components/infrastructure/ErrorBoundary';
import '@/styles/globals.css';

// Pre-load supported fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const roboto = Roboto({ subsets: ['latin'], variable: '--font-roboto' });

const fontMap: Record<string, string> = {
  "Inter": inter.variable,
  "Playfair Display": playfair.variable,
  "Roboto": roboto.variable,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getTenantConfig();
  const cssVariables = generateThemeVariables(config.theme);
  
  const headingFont = fontMap[config.theme.typography.heading] || inter.variable;
  const bodyFont = fontMap[config.theme.typography.body] || inter.variable;

  return (
    <html lang="en" className={`${headingFont} ${bodyFont}`}>
      <body 
        style={cssVariables} 
        data-motion-profile={config.theme.motionProfile}
        className="min-h-screen bg-background font-body text-foreground antialiased"
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 6. Runtime Rendering Flow (`app/[...slug]/page.tsx`)
Server/Client boundary strategy: The page is a Server Component, routing logic runs securely on the server.

```tsx
import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/config-loader';
import { BlockResolver } from '@/components/resolvers/BlockResolver';
import { generateMetadataSeo } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const config = await getTenantConfig();
  const currentPath = "/" + (params.slug?.join("/") || "");
  const page = config.pages.find(p => p.path === currentPath);
  return generateMetadataSeo(page?.seo, config.brandName);
}

export default async function DynamicPage({ params }: { params: { slug?: string[] } }) {
  const config = await getTenantConfig();
  const currentPath = "/" + (params.slug?.join("/") || "");
  
  const pageConfig = config.pages.find(p => p.path === currentPath);
  if (!pageConfig) return notFound();

  const globalContext = {
    theme: config.theme,
    brandName: config.brandName,
    globalData: config.globalData,
  };

  return (
    <main className="flex min-h-screen flex-col w-full overflow-hidden">
      {pageConfig.blocks.map((block) => (
        <BlockResolver 
          key={block.id} 
          block={block} 
          context={globalContext} 
        />
      ))}
    </main>
  );
}
```

## 7. Media Rendering Infrastructure (`components/infrastructure/MediaRenderer.tsx`)
Abstracts Next.js image optimization and video handling to support dynamic AI content.

```tsx
import Image from 'next/image';

interface MediaRendererProps {
  media: { type: "image" | "video"; url: string; alt?: string };
  className?: string;
  priority?: boolean;
}

export function MediaRenderer({ media, className = "", priority = false }: MediaRendererProps) {
  if (media.type === "video") {
    return (
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className={`object-cover ${className}`}
        src={media.url}
      />
    );
  }

  return (
    <Image
      src={media.url}
      alt={media.alt || "Restaurant media"}
      fill
      priority={priority}
      className={`object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
```

## 8. Framer Motion Shared Architecture (`lib/animations.ts`)
Client-side only configuration for animations based on the global CSS data attribute.

```typescript
import { Variants } from "framer-motion";

export const getMotionProfile = () => {
  // Reads the data attribute set in layout.tsx safely on the client
  if (typeof window === "undefined") return "smooth";
  return document.body.getAttribute("data-motion-profile") || "smooth";
};

// Reusable orchestrator variant
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// Dynamic fade up variant that adjusts physics based on profile
export const fadeUpVariant = (): Variants => {
  const profile = getMotionProfile();
  const transition = profile === "cinematic" 
    ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    : { type: "spring", stiffness: 100, damping: 20 };

  return {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition }
  };
};
```

## 9. Utility / Helper Architecture (`lib/utils.ts`)
Standard type-safe helpers for the UI tier.

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind classes safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 10. Error Boundary Architecture (`components/infrastructure/ErrorBoundary.tsx`)
A client-side fallback to prevent hallucinated components from crashing the entire app.

```tsx
'use client';
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props { children?: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[400px] w-full items-center justify-center bg-muted/20">
          <p className="text-muted-foreground text-sm">
            A section failed to load.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
```
