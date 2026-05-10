# Reusable Ultra-Modern Restaurant Website System
**Tech Stack:** Next.js App Router, Tailwind CSS, shadcn/ui, Framer Motion.

## 1. Full Architecture Overview
The system is designed as a **Config-Driven Single-Codebase Platform** (Multi-tenant ready). Instead of hardcoding layouts for different restaurant types (sushi, pizza, burger, premium, cafe), the entire app's layout, theming, component variants, and content are driven by a centralized JSON/TS configuration. 

- **Routing:** Handled via Next.js App Router. Dynamic catch-all routes `app/[...slug]` render specific page blocks based on the config.
- **Rendering Strategy:** SSG (Static Site Generation) or ISR (Incremental Static Regeneration) by default to ensure extreme performance for public-facing pages, reading from the configuration at build time.
- **Animation:** Centralized Framer Motion hooks that apply cinematic, scroll-triggered reveal animations universally across all variants without polluting the UI code.
- **UI Primitives:** shadcn/ui used as the base, overridden heavily via Tailwind configuration to map directly to the dynamic config file.

## 2. Folder Structure
The architecture isolates configuration and generation from core components.

```text
/templates
├── /app                  # Next.js App Router root (dynamic catch-all [...slug])
├── /components
│   ├── /ui               # Base shadcn/ui primitives (buttons, dialogs, inputs)
│   ├── /blocks           # Config-driven composite sections (Hero, BentoMenu, Testimonials)
│   ├── /layouts          # Structural components (Headers, Footers, Sidebars)
│   └── /variants         # Logic mapping config string (e.g., 'hero-video') to the actual React component
├── /config
│   ├── /schema           # Zod schemas defining the strict shape of a restaurant config
│   └── /tenants          # Individual restaurant configs (sushi.json, pizza.json, premium.json)
├── /generated            # Output folder for AI or CI/CD pipelines (pre-compiled themes, optimized assets)
├── /lib
│   ├── /animations       # Reusable Framer Motion variants (fade-up, parallax, magnetic-hover)
│   ├── /theme-generator  # Scripts that parse tenant JSON and generate CSS variable strings
│   └── /utils            # Tailwind merge, generic helpers
└── /styles
    └── globals.css       # Core CSS, injects the generated theme CSS variables
```

## 3. Component Hierarchy
Components are built to act as 'slots' that are filled by the active configuration.

```text
<RootLayout> (Injects dynamic CSS variables to :root based on active config)
  <ThemeProvider>
    <HeaderResolver> (Reads config.layout.header -> renders TransparentStickyHeader or SolidHeader)
    
    <PageBuilder> (Iterates over config.pages[currentSlug].blocks)
      <BlockResolver type="hero" variant="cinematic-video">
        <HeroCinematicVideo /> (Uses Framer Motion for load-in animations)
      </BlockResolver>
      
      <BlockResolver type="menu" variant="bento-grid">
        <MenuBentoGrid /> (Fetches menu categories from config)
      </BlockResolver>
      
      <BlockResolver type="about" variant="split-screen-parallax">
        <AboutSplitScreen />
      </BlockResolver>
    </PageBuilder>
    
    <FooterResolver> (Reads config.layout.footer)
  </ThemeProvider>
</RootLayout>
```

## 4. Template System Structure
Templates are not separate codebases. They are strict JSON configuration sets combined with an asset map.
- **Sushi Template:** Configures a dark mode theme, precise geometric typography (e.g., Inter), 'bento-grid' menu variant, and minimalistic animations.
- **Premium Dining:** Configures a cinematic layout, serif typography (e.g., Playfair Display), 'hero-video' variant, high contrast, and smooth parallax scrolling.
- **Burger Joint:** Configures vibrant colors, bold/chunky typography, 'split-screen' dynamic hero, and magnetic button interactions.

## 5. Variant System Structure
Variants determine *how* a section looks without changing *what* it does. Handled using `cva` (class-variance-authority) and React mapping.

- **Hero Variants:** `cinematic-video`, `split-screen`, `minimal-centered`, `parallax-image`
- **Menu Variants:** `bento-grid`, `classic-list`, `masonry-cards`
- **Navigation Variants:** `sticky-glassmorphism`, `hidden-fullscreen-overlay`, `classic-top-bar`
- **Typography Variants:** Configured globally, mapped to Tailwind classes like `font-heading` and `font-sans`.

## 6. Config-Driven Architecture
The heart of the system. A strict, strongly-typed (Zod) configuration file controls everything.

```typescript
// /config/schema/site-config.ts
export interface SiteConfig {
  brand: {
    name: string;
    logoUrl: string;
  };
  theme: {
    primaryColor: string; // Hex
    accentColor: string;
    backgroundColor: string;
    fontHeading: 'inter' | 'playfair' | 'outfit';
    fontBody: 'inter' | 'roboto';
    radius: '0' | '0.5rem' | '1rem';
  };
  layout: {
    header: 'glass' | 'solid' | 'overlay';
    hero: 'video' | 'parallax' | 'split';
  };
  content: {
    hero: { headline: string; subheadline: string; mediaUrl: string; };
    menuCategories: Array<{ title: string; items: MenuItem[] }>;
  };
}
```

## 7. Dynamic Branding Architecture
Branding is injected at runtime or build-time via inline CSS variables attached to the `<html>` or `<body>` tag, overriding Tailwind's defaults.
- A utility in `/lib/theme-generator/` converts `#RRGGBB` from the config into HSL values required by shadcn/ui (`--primary: 222 47% 11%;`).
- Custom fonts are dynamically imported via `next/font/google` based on the config string and applied to `--font-heading` and `--font-body`.

## 8. Theme System
Extends standard shadcn/ui.
- **Colors:** Fully dynamic. Tailwind config uses `hsl(var(--primary))`.
- **Radii:** Configurable border radius (`--radius`) to shift the UI from sharp and luxurious (radius: 0) to friendly and modern (radius: 1rem).
- **Motion:** Framer motion presets (e.g., `transition: { type: "spring", stiffness: 100 }`) are bound to a "motion profile" in the theme config (e.g., 'smooth', 'snappy', 'luxurious').

## 9. Image/Content Management Strategy
- **Asset Abstraction:** The code never hardcodes images. All URLs come from the JSON config.
- **Optimization:** All images pass through Next.js `<Image />` for automated WebP conversion and responsive sizing.
- **Placeholder Generation:** Use `placeholder="blur"` with base64 blurDataURLs pre-generated during the build step using an AI script in the `/generated` folder to prevent layout shifts.

## 10. AI-Friendly Scalable Structure (Automation Ready)
This structure is explicitly designed so an AI Agent can build a completely new restaurant website *without writing code*. 
- **The Workflow:** 
  1. AI receives a prompt: "I need a website for an upscale vegan cafe in Brooklyn."
  2. AI generates **only** a `brooklyn-vegan.json` file conforming to the Zod schema.
  3. AI places the JSON in `/config/tenants/`.
  4. The AI populates media URLs by generating/fetching assets into an asset bucket.
  5. The Next.js system reads the JSON, compiles the theme, selects the correct variants (`minimal-centered` hero, `bento-grid` menu), applies the "earthy green" color palette, and the site is instantly production-ready.
- **No Hallucinations:** Because the AI only generates a structured JSON configuration against a strict Zod schema, there is zero risk of it hallucinating invalid React code or breaking the layout.
