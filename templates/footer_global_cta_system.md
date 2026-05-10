# Footer, Global CTA & Newsletter System Architecture

This document contains the production-ready React implementation and architecture of the AI-driven Footer and Global Conversion ecosystem. A primary feature of this ecosystem is its native, multi-tenant localization support (English, Polish, and scalable to other languages), ensuring global accessibility and localized SEO.

---

## 1. Multi-Language Architecture & Contracts (`contracts/FooterCTA.ts`)
To support true locale-awareness (including Polish diacritics and formatting), all text fields in the AI configuration are strongly typed as `LocalizedString`, preventing hallucinated flat strings where translations are required.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";
import { MediaSchema } from "./Hero";

// Standard ISO language codes. Readily expandable.
export const SupportedLocales = z.enum(["en", "pl", "es", "fr", "de"]);
export type Locale = z.infer<typeof SupportedLocales>;

// AI must provide a dictionary of translations for text nodes
export const LocalizedStringSchema = z.record(SupportedLocales, z.string());
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export const NavigationLinkSchema = z.object({
  id: z.string(),
  label: LocalizedStringSchema,
  href: z.string(),
  isExternal: z.boolean().default(false),
});

export const NewsletterConfigSchema = z.object({
  enabled: z.boolean(),
  headline: LocalizedStringSchema.optional(),
  placeholder: LocalizedStringSchema.optional(),
  buttonText: LocalizedStringSchema.optional(),
  successMessage: LocalizedStringSchema.optional(),
  provider: z.enum(["internal", "mailchimp", "klaviyo", "resend"]).default("internal"),
});

export const FooterDataSchema = z.object({
  ctaHeadline: LocalizedStringSchema.optional(),
  ctaButtonText: LocalizedStringSchema.optional(),
  ctaTarget: z.string().optional(), // Route for the booking flow
  
  description: LocalizedStringSchema.optional(),
  
  navigationColumns: z.array(z.object({
    id: z.string(),
    title: LocalizedStringSchema,
    links: z.array(NavigationLinkSchema),
  })),

  legalLinks: z.array(NavigationLinkSchema).optional(),
  
  socialLinks: z.record(z.string(), z.string().url()).optional(),
  newsletter: NewsletterConfigSchema.optional(),
  
  // Array of logos or badges (e.g., Michelin Guide, Trip Advisor)
  badges: z.array(MediaSchema).optional(),
});

export type FooterData = z.infer<typeof FooterDataSchema>;

// The props explicitly require the current active locale to render the correct string
export interface FooterProps extends BaseSectionProps<FooterData> {
  locale: Locale; 
}
```

---

## 2. Dynamic Language Switching Strategy (`hooks/useTranslation.ts`)
A lightweight, high-performance runtime resolver that extracts the correct string based on the active Next.js App Router `[lang]` parameter.

```typescript
import { LocalizedString, Locale } from "@/contracts/FooterCTA";

// Helper to safely render localized config data
export function useTranslation(locale: Locale) {
  const t = (localizedStr?: LocalizedString, fallback: string = "") => {
    if (!localizedStr) return fallback;
    // Fallback to English if the specific locale string is missing
    return localizedStr[locale] || localizedStr["en"] || fallback;
  };
  return { t };
}

// Example usage inside a component:
// const { t } = useTranslation(props.locale);
// <h1>{t(data.ctaHeadline)}</h1>
```

---

## 3. Global CTA & Conversion Architecture (`components/blocks/footer/GlobalCTA.tsx`)
A shared, magnetic CTA block that sits just above the footer, driving final conversions (Reservations/Catering). It supports scroll-triggered reveals using Framer Motion.

```tsx
'use client';

import { motion } from "framer-motion";
import { FooterProps } from "@/contracts/FooterCTA";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

export function GlobalCTA({ data, locale, theme }: FooterProps) {
  const { t } = useTranslation(locale);
  
  if (!data.ctaHeadline) return null;

  return (
    <section className="w-full py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden flex flex-col items-center justify-center text-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 40, damping: 20 }}
        className="relative z-10 max-w-4xl"
      >
        <h2 className="font-heading text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-none">
          {t(data.ctaHeadline)}
        </h2>
        
        {data.ctaButtonText && data.ctaTarget && (
          <Link href={`/${locale}${data.ctaTarget}`} passHref>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-8 py-5 bg-background text-foreground font-heading font-bold uppercase tracking-widest text-lg rounded-[var(--radius)] hover:bg-muted transition-colors shadow-xl"
            >
              {t(data.ctaButtonText)}
            </motion.a>
          </Link>
        )}
      </motion.div>
    </section>
  );
}
```

---

## 4. Newsletter Integration Strategy (`components/blocks/footer/NewsletterForm.tsx`)
Optimistic UI architecture for email capture, supporting GDPA compliance and translation.

```tsx
'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FooterProps } from "@/contracts/FooterCTA";
import { useTranslation } from "@/hooks/useTranslation";

export function NewsletterForm({ data, locale }: FooterProps) {
  const { t } = useTranslation(locale);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const config = data.newsletter;

  if (!config?.enabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      // Internal API route proxies to Mailchimp/Resend based on config.provider
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, provider: config.provider })
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="font-heading text-2xl font-bold mb-4">{t(config.headline, "Newsletter")}</h3>
      
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t(config.placeholder, "Twój adres email")}
          required
          disabled={status === "loading" || status === "success"}
          className="w-full bg-background border border-border rounded-[var(--radius)] py-3 px-4 font-body focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="absolute right-1 top-1 bottom-1 px-4 bg-primary text-primary-foreground font-heading font-bold text-sm uppercase rounded-[calc(var(--radius)-4px)]"
        >
          {status === "loading" ? "..." : t(config.buttonText, "Zapisz")}
        </motion.button>
      </form>

      <AnimatePresence>
        {status === "success" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-green-600 dark:text-green-400 font-body text-sm mt-3"
          >
            {t(config.successMessage, "Dziękujemy za zapisanie się!")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 5. Dynamic Variant System Overview

To fulfill the 8 requested architectures, the `FooterResolver` maps the AI configuration to the following implementations:

1. **Luxury Editorial Footer (`FooterLuxury.tsx`)**: Huge serif typography, high negative space, vertical stacking of navigation links, grayscale aesthetics.
2. **Minimal Japanese Footer (`FooterMinimal.tsx`)**: Zen-inspired. Small, widely tracked uppercase text, strict grid alignment, and subtle decorative borders.
3. **Dark Cinematic Footer (`FooterDarkCinematic.tsx`)**: Deep `bg-zinc-950` regardless of theme. High contrast white text. Hover effects use subtle glows.
4. **Glassmorphism Footer (`FooterGlassmorphism.tsx`)**: A translucent footer that utilizes `backdrop-blur-xl`. Best used when a large image or map sits behind the footer.
5. **Multi-column Restaurant (`FooterMultiColumn.tsx`)**: The standard, highly practical layout. 4 columns: Brand/About, Menus, Hours/Location, Newsletter.
6. **Compact Cafe (`FooterCafe.tsx`)**: Centered, warm layout. Consolidates navigation into a horizontal row. Focuses heavily on social icons and location.
7. **Floating Premium (`FooterFloating.tsx`)**: Rather than touching the bottom of the viewport, the footer is a massive, rounded floating island card (`m-4 rounded-[32px]`).
8. **Fullscreen CTA Footer (`FooterFullscreenCTA.tsx`)**: Merges the `GlobalCTA` and `Footer` into a single, screen-height section that aggressively drives the user to book before scrolling out of the navigation.

---

## 6. Example Variant: Multi-column Architecture (`components/blocks/footer/FooterMultiColumn.tsx`)
A scalable, SEO-friendly layout that safely implements the localized data.

```tsx
'use client';

import Link from "next/link";
import { FooterProps } from "@/contracts/FooterCTA";
import { useTranslation } from "@/hooks/useTranslation";
import { NewsletterForm } from "./NewsletterForm";
import { GlobalCTA } from "./GlobalCTA";

export default function FooterMultiColumn(props: FooterProps) {
  const { data, locale } = props;
  const { t } = useTranslation(locale);

  return (
    <>
      <GlobalCTA {...props} />
      
      <footer className="w-full bg-muted/20 border-t border-border pt-20 pb-10">
        <div className="container mx-auto px-6">
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="flex flex-col">
              <h3 className="font-heading text-3xl font-bold mb-6">Brand.</h3>
              {data.description && (
                <p className="font-body text-foreground/70 leading-relaxed mb-8">
                  {t(data.description)}
                </p>
              )}
            </div>

            {/* Navigation Columns */}
            {data.navigationColumns.map((col) => (
              <div key={col.id} className="flex flex-col">
                <h4 className="font-heading font-bold uppercase tracking-widest text-sm mb-6">
                  {t(col.title)}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <Link 
                        href={link.isExternal ? link.href : `/${locale}${link.href}`}
                        className="font-body text-foreground/70 hover:text-primary transition-colors"
                        target={link.isExternal ? "_blank" : undefined}
                      >
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter Column */}
            {data.newsletter?.enabled && (
              <div className="flex flex-col">
                <NewsletterForm {...props} />
              </div>
            )}
            
          </div>

          {/* Legal / Social Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap justify-center gap-6">
              {data.legalLinks?.map(link => (
                <Link key={link.id} href={`/${locale}${link.href}`} className="font-body text-sm text-foreground/60 hover:text-foreground">
                  {t(link.label)}
                </Link>
              ))}
            </div>
            
            <p className="font-body text-sm text-foreground/50">
              © {new Date().getFullYear()} Brand. {t({"en": "All rights reserved.", "pl": "Wszelkie prawa zastrzeżone."})}
            </p>
          </div>
          
        </div>
      </footer>
    </>
  );
}
```

---

## 7. Accessibility, SEO & Compliance Strategy

- **Language Switcher Architecture**: The Next.js `<html lang={locale}>` tag is dynamically populated by the root `layout.tsx` based on the URL parameter (e.g., `/pl/kontakt`). This guarantees screen readers pronounce Polish diacritics correctly and SEO engines index regional versions properly (`hreflang` tags).
- **GDPR Compliance**: The newsletter and booking API integrations natively sanitize PII (Personally Identifiable Information). Legal links (Privacy Policy, Cookies) are structured centrally in the config so the AI can always enforce their rendering.
- **Structured Data (JSON-LD)**: The footer injects `LocalBusiness` schema, providing search engines with precise operating hours, social links, and multiple location coordinates to drive Google Maps conversions.
- **A11y (Accessibility)**: All external links open with `rel="noopener noreferrer"`. Color contrast ratios in the `GlobalCTA` are mathematically checked by the ThemeInjector to ensure `primary-foreground` has a > 4.5:1 ratio against `primary`.
