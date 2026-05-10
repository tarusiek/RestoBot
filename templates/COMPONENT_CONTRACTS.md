# Component Contracts & Page Builder Architecture

This document defines the strict APIs, TypeScript interfaces, Zod schemas, and rendering pipelines required to support the AI-driven, 100% config-based restaurant website generation platform.

---

## 1. AI-Safe Schema & Zod Validation Architecture
To ensure zero hallucination, the AI generates a strict JSON payload validated against Zod schemas before rendering.

```typescript
import { z } from "zod";

// 1. Theme & Design Tokens
export const ThemeSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^hsl\(/),
    background: z.string(),
    foreground: z.string(),
  }),
  typography: z.object({
    heading: z.string(), // e.g., "Playfair Display"
    body: z.string(),
  }),
  radius: z.enum(["none", "sm", "md", "lg", "full"]),
  motionProfile: z.enum(["snappy", "smooth", "cinematic", "reduced"]),
});

// 2. Block/Section Level Data
export const BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["hero", "menu", "about", "gallery", "testimonials", "contact"]),
  variant: z.string(), // Resolves to specific UI (e.g., "split-screen", "bento-grid")
  data: z.record(z.any()), // Validated specifically by the component
});

// 3. Multi-Page Routing
export const PageSchema = z.object({
  path: z.string(), // "/", "/menu", "/about"
  seo: z.object({ title: z.string(), description: z.string() }),
  blocks: z.array(BlockSchema),
});

// 4. Global Layout
export const LayoutSchema = z.object({
  headerVariant: z.enum(["transparent-sticky", "solid-standard", "hidden-overlay"]),
  footerVariant: z.enum(["minimal", "comprehensive-sitemap"]),
});

// 5. The Root AI Config Contract
export const RestaurantConfigSchema = z.object({
  tenantId: z.string(),
  brandName: z.string(),
  theme: ThemeSchema,
  layout: LayoutSchema,
  pages: z.array(PageSchema),
  globalData: z.record(z.any()), // e.g., social links, operating hours
});

export type RestaurantConfig = z.infer<typeof RestaurantConfigSchema>;
export type BlockConfig = z.infer<typeof BlockSchema>;
```

---

## 2. Component Contract System & Base Section API
Every UI Section in the platform adheres to a strict interface contract. They must be pure functions that take `data` and `globalContext` without fetching their own state.

```typescript
// /contracts/BaseSection.ts

export interface GlobalContext {
  theme: ThemeConfig;
  brandName: string;
  globalData: Record<string, any>;
}

// Every block component adheres to this
export interface BaseSectionProps<TData = any> {
  data: TData;
  context: GlobalContext;
}

// Example specific data contract for the Hero block
export interface HeroData {
  headline: string;
  subheadline?: string;
  primaryCta?: { label: string; url: string };
  media: { type: "image" | "video"; url: string; alt: string };
}
```

---

## 3. Dynamic Section Registry & VariantResolver System
The registry maps the JSON `type` and `variant` string tokens to actual lazy-loaded React components.

```typescript
// /registry/BlockRegistry.ts
import dynamic from 'next/dynamic';

export const BlockRegistry: Record<string, Record<string, React.ComponentType<BaseSectionProps>>> = {
  hero: {
    "cinematic": dynamic(() => import('@/components/blocks/hero/HeroCinematic')),
    "split-screen": dynamic(() => import('@/components/blocks/hero/HeroSplitScreen')),
    "minimal": dynamic(() => import('@/components/blocks/hero/HeroMinimal')),
  },
  menu: {
    "bento-grid": dynamic(() => import('@/components/blocks/menu/MenuBentoGrid')),
    "classic-list": dynamic(() => import('@/components/blocks/menu/MenuClassic')),
  }
};
```

---

## 4. BlockResolver System
The BlockResolver safely looks up the component in the registry. If an AI hallucinates a variant that doesn't exist, it falls back gracefully.

```tsx
// /components/resolvers/BlockResolver.tsx
export function BlockResolver({ block, context }: { block: BlockConfig, context: GlobalContext }) {
  const variantMap = BlockRegistry[block.type];
  
  if (!variantMap) {
    console.warn(`Block type ${block.type} not found.`);
    return null; 
  }

  // Fallback to "default" or the first available variant if hallucinated
  const Component = variantMap[block.variant] || variantMap[Object.keys(variantMap)[0]];

  return (
    <section id={block.id} className="relative w-full">
      <Component data={block.data} context={context} />
    </section>
  );
}
```

---

## 5. Theme & Animation Injection Flow
Before rendering blocks, the layout injects the design system.

```tsx
// /components/resolvers/ThemeInjector.tsx
export function ThemeInjector({ theme, children }: { theme: ThemeConfig, children: React.ReactNode }) {
  // Converts JSON colors and radii into CSS variables
  const cssVariables = generateThemeVariables(theme);
  
  return (
    <div 
      style={cssVariables} 
      className={`font-${theme.typography.body} antialiased w-full min-h-screen`}
      data-motion-profile={theme.motionProfile}
    >
      {children}
    </div>
  );
}
```

---

## 6. Page Builder Architecture & Dynamic Route Rendering Strategy
Next.js App Router dynamic routes (`app/[...slug]/page.tsx`) handle 100% of the URL structure dynamically.

```tsx
// /app/[...slug]/page.tsx
import { getTenantConfig } from "@/lib/config-loader";

export default async function DynamicPage({ params }: { params: { slug: string[] } }) {
  const config = await getTenantConfig();
  const currentPath = "/" + (params.slug?.join("/") || "");
  
  // 1. Data Normalization & Routing Strategy
  const pageConfig = config.pages.find(p => p.path === currentPath);
  
  if (!pageConfig) return <NotFound />;

  const globalContext: GlobalContext = {
    theme: config.theme,
    brandName: config.brandName,
    globalData: config.globalData,
  };

  // 2. Block Rendering Pipeline
  return (
    <ThemeInjector theme={config.theme}>
      <LayoutResolver layout={config.layout} context={globalContext}>
        
        <main className="flex flex-col min-h-screen">
          {pageConfig.blocks.map((block) => (
            <BlockResolver 
              key={block.id} 
              block={block} 
              context={globalContext} 
            />
          ))}
        </main>

      </LayoutResolver>
    </ThemeInjector>
  );
}
```

---

## 7. Example AI-Generated Restaurant Config (JSON)
The AI agent creates this document, and the pipeline converts it into a full Next.js application.

```json
{
  "tenantId": "premium-sushi-001",
  "brandName": "Kazan Omakase",
  "theme": {
    "colors": {
      "primary": "hsl(12, 80%, 60%)",
      "background": "hsl(220, 10%, 8%)",
      "foreground": "hsl(0, 0%, 98%)"
    },
    "typography": {
      "heading": "Playfair Display",
      "body": "Inter"
    },
    "radius": "none",
    "motionProfile": "cinematic"
  },
  "layout": {
    "headerVariant": "transparent-sticky",
    "footerVariant": "minimal"
  },
  "globalData": {
    "reservationsUrl": "https://resy.com/...",
    "instagram": "@kazan_omakase"
  },
  "pages": [
    {
      "path": "/",
      "seo": { "title": "Kazan | Premium Omakase", "description": "..." },
      "blocks": [
        {
          "id": "hero-1",
          "type": "hero",
          "variant": "cinematic",
          "data": {
            "headline": "Mastery in Every Bite.",
            "subheadline": "Tokyo tradition meets modern innovation.",
            "media": {
              "type": "video",
              "url": "https://cdn.example.com/sushi-broll.mp4",
              "alt": "Chef preparing sushi"
            }
          }
        },
        {
          "id": "menu-1",
          "type": "menu",
          "variant": "bento-grid",
          "data": {
            "categories": [
              { "title": "Nigiri", "items": [{ "name": "Otoro", "price": "$18" }] }
            ]
          }
        }
      ]
    }
  ]
}
```

## Summary of Architecture Flows:
- **Image/Content Injection Flow:** The `media.url` from JSON is passed directly into a reusable `<MediaRenderer />` component that handles Next.js `<Image>` optimization or HTML5 video fallback automatically.
- **Dynamic Animation Injection Flow:** The `motionProfile` CSS data attribute (`data-motion-profile="cinematic"`) acts as a global hook. Reusable Framer Motion variants defined in `/lib/animations.ts` read this profile to determine stiffness, damping, and stagger delays.
- **Reusable Section Communication Patterns:** Blocks do not communicate horizontally. If global state is needed (e.g., opening a booking modal from a hero CTA), they communicate upward via Zustand store triggers using action strings defined in the JSON (e.g., `primaryCta: { action: "OPEN_BOOKING_MODAL" }`).
