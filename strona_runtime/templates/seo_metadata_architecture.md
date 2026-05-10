# SEO, Metadata & Structured Data Architecture

This document contains the production-ready architecture for the AI-driven SEO and Metadata ecosystem. It leverages the Next.js 15 App Router (`generateMetadata`), advanced Schema.org JSON-LD structured data, and native multi-language routing (`hreflang`) to guarantee maximum discoverability and optimal Core Web Vitals for both Polish and English markets.

---

## 1. SEO Contracts & AI-Safe Validation (`contracts/SEO.ts`)
Strict Zod schemas ensure the AI provides translation-ready meta titles, descriptions, and Open Graph configurations without exceeding character limits or hallucinating unsupported meta tags.

```typescript
import { z } from "zod";
import { LocalizedStringSchema, SupportedLocales } from "./FooterCTA";
import { MediaSchema } from "./Hero";

export const SEOMetaSchema = z.object({
  title: LocalizedStringSchema, // E.g., { "en": "Best Sushi", "pl": "Najlepsze Sushi" }
  description: LocalizedStringSchema,
  keywords: z.record(SupportedLocales, z.array(z.string())).optional(),
  ogImage: MediaSchema.optional(), // Custom OG Image fallback
  noIndex: z.boolean().default(false),
});

export const SEOGlobalConfigSchema = z.object({
  siteName: LocalizedStringSchema,
  baseUrl: z.string().url(),
  twitterHandle: z.string().optional(),
  facebookPage: z.string().url().optional(),
  defaultOgImage: MediaSchema,
});

export type SEOMeta = z.infer<typeof SEOMetaSchema>;
export type SEOGlobalConfig = z.infer<typeof SEOGlobalConfigSchema>;
```

---

## 2. Dynamic Metadata Generation Flow (`app/[lang]/layout.tsx`)
Leverages Next.js `generateMetadata` to map the AI config and current `[lang]` parameter to HTML meta tags. Automatically handles Polish and English canonicals and `hreflang` tags for international SEO.

```typescript
import { Metadata, ResolvingMetadata } from 'next';
import { SEOMeta, SEOGlobalConfig } from '@/contracts/SEO';
import { Locale } from '@/contracts/FooterCTA';

interface Props {
  params: { lang: Locale };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata(
  { params: { lang } }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const config: SEOGlobalConfig = await fetchGlobalSEOConfig();
  const pageMeta: SEOMeta = await fetchPageSEOConfig(lang);

  const baseUrl = config.baseUrl;
  const canonicalUrl = `${baseUrl}/${lang}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: pageMeta.title[lang],
      template: `%s | ${config.siteName[lang]}`,
    },
    description: pageMeta.description[lang],
    keywords: pageMeta.keywords?.[lang]?.join(", "),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en`,
        'pl': `${baseUrl}/pl`,
        'x-default': `${baseUrl}/en`, // Best practice for multi-region mapping
      },
    },
    openGraph: {
      title: pageMeta.title[lang],
      description: pageMeta.description[lang],
      url: canonicalUrl,
      siteName: config.siteName[lang],
      images: [
        {
          url: pageMeta.ogImage?.url || config.defaultOgImage.url,
          width: 1200,
          height: 630,
          alt: pageMeta.title[lang],
        },
      ],
      locale: lang === 'en' ? 'en_US' : 'pl_PL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageMeta.title[lang],
      description: pageMeta.description[lang],
      creator: config.twitterHandle,
      images: [pageMeta.ogImage?.url || config.defaultOgImage.url],
    },
    robots: {
      index: !pageMeta.noIndex,
      follow: !pageMeta.noIndex,
      googleBot: {
        index: !pageMeta.noIndex,
        follow: !pageMeta.noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

---

## 3. Structured Data (JSON-LD) Generation System (`lib/seo/schema-generators.ts`)
Programmatically translates the restaurant configuration (menu, locations, reviews) into Schema.org JSON-LD to unlock Google Rich Snippets (stars, prices, booking buttons).

```typescript
import { RestaurantConfig } from "@/contracts/System";

export function generateRestaurantSchema(config: RestaurantConfig, lang: string) {
  const { brand, contact, testimonials } = config;
  
  // Aggregate reviews mathematically
  const validReviews = testimonials?.testimonials.filter(t => t.rating) || [];
  const aggregateRating = validReviews.length > 0 ? {
    "@type": "AggregateRating",
    "ratingValue": (validReviews.reduce((acc, t) => acc + (t.rating || 5), 0) / validReviews.length).toFixed(1),
    "reviewCount": validReviews.length
  } : undefined;

  // Multi-location support array
  const locationSchemas = contact?.locations.map(loc => ({
    "@type": "Restaurant", // or "LocalBusiness"
    "name": brand.name[lang],
    "image": brand.logo?.url,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": loc.address,
    },
    "telephone": loc.phone,
    "acceptsReservations": "True",
    "menu": `${config.seo.baseUrl}/${lang}/menu`,
    "servesCuisine": brand.cuisineType?.[lang], // e.g., "Sushi", "Włoska"
    "priceRange": brand.priceRange || "$$", // e.g., "$$$"
    "aggregateRating": aggregateRating,
    "review": validReviews.map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.author },
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
      "reviewBody": r.text
    }))
  }));

  return {
    "@context": "https://schema.org",
    "@graph": locationSchemas
  };
}
```

### JSON-LD Injection Component (`components/seo/StructuredData.tsx`)
```tsx
export function StructuredData({ schema }: { schema: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 4. Multi-Location SEO & Dynamic City Pages (`app/[lang]/locations/[city]/page.tsx`)
For restaurants with multiple locations, the system dynamically generates city-specific landing pages using Static Site Generation (SSG).

```typescript
export async function generateStaticParams() {
  const config = await fetchTenantConfig();
  const locales = ["en", "pl"];
  const paths = [];

  for (const locale of locales) {
    for (const location of config.contact.locations) {
      // e.g. location.city = "warsaw"
      paths.push({ lang: locale, city: location.citySlug }); 
    }
  }
  
  return paths;
}
```
*Each city page injects its own specific `LocalBusiness` schema, ensuring local discovery in Google Maps is mathematically mapped to the specific URL.*

---

## 5. Dynamic Open Graph Image Generation (`app/api/og/route.tsx`)
Uses `@vercel/og` to dynamically render social preview images at the edge. If the AI doesn't explicitly define an `ogImage`, the system generates a branded one on the fly.

```tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Restaurant';
  const subtitle = searchParams.get('subtitle') || 'Book a table today';
  const bgImage = searchParams.get('bg') || 'default-bg-url.jpg';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
        <img src={bgImage} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', zIndex: 10, color: 'white' }}>
          <h1 style={{ fontSize: '80px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>{title}</h1>
          <p style={{ fontSize: '40px', marginTop: '20px', color: '#ffeb3b' }}>{subtitle}</p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 6. Dynamic Sitemap & robots.txt Generation

### `app/sitemap.ts`
Generates a dynamic XML sitemap per tenant, adhering to the Next.js API.
```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await fetchTenantConfig();
  const baseUrl = config.seo.baseUrl;
  const locales = ["en", "pl"];
  
  const sitemapEntries = [];

  locales.forEach((lang) => {
    // Root
    sitemapEntries.push({ url: `${baseUrl}/${lang}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 });
    // Menu
    sitemapEntries.push({ url: `${baseUrl}/${lang}/menu`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 });
    // Locations
    config.contact.locations.forEach((loc) => {
      sitemapEntries.push({ url: `${baseUrl}/${lang}/locations/${loc.citySlug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 });
    });
  });

  return sitemapEntries;
}
```

### `app/robots.ts`
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://restaurant.com/sitemap.xml',
  };
}
```

---

## 7. Performance & Core Web Vitals Strategy

1. **Edge Rendering / ISR**: Tenant configurations are cached heavily via Incremental Static Regeneration (ISR). Time-to-First-Byte (TTFB) remains consistently low as HTML is statically evaluated where possible.
2. **Dynamic Image Optimization**: All instances of `MediaRenderer` output `<Image />` from `next/image`, which automatically negotiates WebP/AVIF formats, applies `srcSet` generation, and enforces `loading="lazy"` on all assets below the fold.
3. **Crawlability Safeguards**: Framer Motion components utilize `whileInView` reveals. We do *not* unmount items from the DOM (e.g., `display: none` or conditional rendering) until JavaScript loads, ensuring the Googlebot can parse text instantly on the initial HTML pass.
4. **Semantic Heading Hierarchy Rules**: The BlockResolver enforces strict hierarchy. The Hero block maps to `<h1>`. All subsequent section blocks (Menu, About, Testimonials) map strictly to `<h2>`, with internal children utilizing `<h3>`. This prevents structural penalties during SEO audits.
5. **Accessibility-Compliant Metadata**: `<html lang="pl">` injection is verified. `aria-label` logic is implemented on all interactive Lightboxes and Carousels to ensure high scores in Google Lighthouse audits.
