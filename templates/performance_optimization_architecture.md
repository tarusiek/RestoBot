# Performance, Optimization & Asset Pipeline Architecture

This document contains the production-ready architecture for the AI-driven Performance and Optimization ecosystem. It guarantees that despite utilizing cinematic media, Framer Motion animations, and dynamic multi-tenant configurations, all generated restaurant websites will target **Lighthouse 95+**, **LCP < 2.5s**, **CLS < 0.1**, and **INP < 200ms**.

---

## 1. Rendering Strategy System (ISR / RSC / Edge)
The core architecture leverages Next.js 15 App Router capabilities to push as much processing to the server and build-time as possible.

- **React Server Components (RSC)**: The root layout, `BlockResolver`, and configuration fetching are 100% Server Components. Zero JavaScript is shipped to the client for parsing the AI JSON configuration.
- **Incremental Static Regeneration (ISR)**: Restaurant configurations are cached indefinitely (`{ next: { tags: ['tenant-config'] } }`). When an admin publishes via the CMS, a webhook triggers `revalidateTag()`, updating the edge cache within 300ms.
- **Edge Middleware**: Tenant resolution (`bistrowarszawa.pl` -> `/pl/bistro-warszawa`) happens at the Vercel Edge using Upstash Redis, adding <50ms to TTFB.

---

## 2. Asset Pipeline & Image Optimization (`components/infrastructure/MediaRenderer.tsx`)
Images and videos are the heaviest assets on restaurant websites. The `MediaRenderer` acts as a strict proxy enforcing performance rules.

### Image Strategy:
- **AVIF/WebP Pipelines**: `next/image` automatically negotiates the modern format based on the browser's `Accept` header.
- **Blur Placeholders**: Uploaded images are passed through a background worker that generates a Base64 blur data URL, preventing CLS (Cumulative Layout Shift) and providing immediate visual feedback.
- **Priority Loading**: The `HeroResolver` automatically attaches `priority={true}` and `fetchPriority="high"` to the very first piece of media above the fold, ensuring instantaneous LCP.
- **Lazy Loading**: All sections below the Hero (Menu, Gallery, About) default to `loading="lazy"`.

```tsx
import Image from "next/image";
import { Media } from "@/contracts/Hero";

export function OptimizedImage({ media, isHero }: { media: Media, isHero?: boolean }) {
  return (
    <Image
      src={media.url}
      alt={media.alt || "Restaurant media"}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={isHero}
      loading={isHero ? "eager" : "lazy"}
      placeholder={media.blurHash ? "blur" : "empty"}
      blurDataURL={media.blurHash}
      className="object-cover"
    />
  );
}
```

### Video Strategy:
- Videos use `<video preload="none">` by default unless they are in the Hero section (`preload="auto"`).
- Background videos strip audio tracks to save bandwidth.

---

## 3. Framer Motion & Animation Performance (`lib/motion-optimization.ts`)
Cinematic animations can cause massive jank on low-end mobile devices if not optimized.

- **GPU Acceleration**: All motion properties target `transform` (x, y, scale) and `opacity`. Framer Motion automatically promotes these to the GPU. We strictly avoid animating `width`, `height`, or `margin` to prevent costly browser repaints.
- **Hardware Acceleration Hack**: Parallax scrolling components inject `translateZ(0)` to force a dedicated compositor layer.
- **Reduced Motion**: The system natively respects OS-level accessibility preferences.

```tsx
import { useReducedMotion } from "framer-motion";

export function useOptimizedMotion(variants: any) {
  const shouldReduceMotion = useReducedMotion();
  
  // Strip translates and scales, leave only simple opacity fades if requested
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.3 } }
    };
  }
  return variants;
}
```

---

## 4. Dynamic Import & Code Splitting Strategy (`components/blocks/BlockResolver.tsx`)
The `BlockResolver` maps AI JSON keys (e.g., `variant: "gallery-cinematic"`) to React components. To prevent the initial bundle from containing 8 different Gallery variants, we utilize `next/dynamic`.

```tsx
import dynamic from 'next/dynamic';

const GalleryCinematic = dynamic(() => import('./gallery/GalleryCinematic'), {
  loading: () => <div className="h-96 w-full animate-pulse bg-muted" />
});

const GalleryBento = dynamic(() => import('./gallery/GalleryBento'));

export function GalleryResolver({ data }) {
  switch (data.variant) {
    case "cinematic-fullscreen": return <GalleryCinematic data={data} />;
    case "bento-grid": return <GalleryBento data={data} />;
    default: return <GalleryMasonry data={data} />;
  }
}
```
*Result: A user visiting a restaurant with a Bento Gallery downloads 0kb of code related to the Cinematic Gallery.*

---

## 5. Font Optimization Strategy (`app/layout.tsx`)
Typography is handled natively via `next/font/google`.

- **Self-Hosting**: Fonts are downloaded at build time and served from the same domain, eliminating extra DNS lookups and TLS handshakes.
- **Display Swap**: Configured with `display: 'swap'` to ensure text is visible immediately in a fallback font, preventing FOIT (Flash of Invisible Text).
- **Preloading**: Only the critical weights (400, 700) requested by the AI configuration are bundled.

```typescript
import { Inter, Playfair_Display } from 'next/font/google';

// Loaded dynamically based on Tenant Config
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-heading' });
```

---

## 6. Progressive Hydration & Streaming Architecture (`app/[lang]/page.tsx`)
React 18 `<Suspense>` boundaries are utilized to stream content. 

- **Critical Path**: The Hero section and Header are streamed first, achieving immediate LCP.
- **Deferred Hydration**: The Footer, Newsletter API connections, and Heavy Masonry Galleries are wrapped in Suspense, hydrating only after the main thread is idle.

```tsx
import { Suspense } from "react";
import { HeroResolver } from "@/components/blocks/HeroResolver";
import { FooterResolver } from "@/components/blocks/FooterResolver";
import { SkeletonFooter } from "@/components/ui/Skeletons";

export default function RestaurantPage({ config }) {
  return (
    <>
      {/* Streamed immediately */}
      <HeroResolver data={config.hero} />
      
      {/* Hydrated progressively */}
      <Suspense fallback={<SkeletonFooter />}>
        <FooterResolver data={config.footer} />
      </Suspense>
    </>
  );
}
```

---

## 7. Interaction to Next Paint (INP) Optimization
To ensure the website responds to taps/clicks in under 200ms:

- **React Hook Form**: Form inputs in the Booking/Contact system use uncontrolled inputs (`register("firstName")`) to avoid continuous React re-renders on every keystroke.
- **Debounced Handlers**: Menu category filtering uses `useTransition` or debounce mechanisms to keep the UI thread unblocked while shuffling layout states.
- **Optimistic UI**: The Booking "Submit" button instantly changes to a loading spinner without waiting for the network request to finish resolving.

---

## 8. Build & Memory Optimization Strategy
- **Bundle Analysis**: `@next/bundle-analyzer` is integrated into the CI/CD pipeline to flag any accidental imports of massive libraries (like `lodash` instead of `lodash-es`).
- **Tree Shaking**: Ensure all Shadcn/Radix primitives are correctly tree-shaken by exporting components atomically.
- **Worker Offloading**: Tasks like generating PDF menus or massive JSON parsing for the CMS are offloaded to Background Workers (Inngest) to avoid blocking Vercel Serverless functions.

---

## 9. AI-Generated Asset Optimization
When the AI generates a theme, it might request heavy assets. 
- **Compression Pipeline**: Any image generated by Fal.ai / OpenAI DALL-E is piped through an S3 lambda trigger that compresses the PNG/JPG into an aggressive WEBP, reducing file size by up to 85% before it reaches the end user.
- **Color Extraction**: A background script extracts the dominant color from the AI image and injects it into the DB as a fallback `blurDataUrl` solid color, guaranteeing smooth transitions even on 3G networks.
