# i18n & Localization Architecture

## 1. i18n Architecture Overview
- **Core Pattern**: Dictionary-less, configuration-embedded translations.
- **Locales**: `en` (English), `pl` (Polish). Extensible via array.
- **Storage**: All textual content stored as localized records inside the JSON config payload.
- **State**: Locale driven exclusively by the Next.js URL param `[lang]`.

## 2. Locale Routing Strategy
- **Structure**: `app/[lang]/page.tsx`.
- **Middleware**: Intercepts requests, detects `Accept-Language`, and redirects `/` to `/pl` or `/en`.
- **Tenant Rewrite**: `bistrowarszawa.pl/menu` -> `/pl/bistro-warszawa/menu`.

## 3. Translation Pipeline
- **Static Assets**: Hardcoded app UI (e.g., standard buttons) uses Next-intl dictionaries.
- **Dynamic Content**: CMS blocks use `LocalizedString` objects.
- **Extraction**: Render layer resolves `LocalizedString[currentLang]`.

## 4. Dynamic Locale Switching
```typescript
import { usePathname, useRouter } from 'next/navigation';

export function LanguageSwitcher({ currentLang }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const switchLang = (newLang) => {
    const newPath = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPath);
  };
  // Returns UI toggling EN / PL
}
```

## 5. CMS Localization Architecture
- **UI Tab Pattern**: Global language toggle in CMS switches all input fields simultaneously.
- **Side-by-Side Pattern**: Field-level toggle allows viewing EN while editing PL.

## 6. Multi-Language SEO
- **`generateMetadata`**: Reads `params.lang` and accesses the corresponding localized SEO strings.
- **Title Tags**: Resolves `config.seo.title[lang]`.

## 7. hreflang System
```typescript
// app/[lang]/layout.tsx (Metadata generation)
export async function generateMetadata({ params: { lang } }) {
  return {
    alternates: {
      canonical: `https://domain.com/${lang}`,
      languages: {
        'en': 'https://domain.com/en',
        'pl': 'https://domain.com/pl',
      },
    },
  };
}
```

## 8. Translation Schemas
```typescript
import { z } from "zod";

export const LocalizedStringSchema = z.object({
  en: z.string().min(1),
  pl: z.string().min(1),
  // Future locales appended here
});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
```

## 9. Localized Config Architecture
- Every block schema enforces `LocalizedStringSchema` instead of `z.string()`.
- Example:
```typescript
export const HeroDataSchema = z.object({
  headline: LocalizedStringSchema,
  subheadline: LocalizedStringSchema.optional(),
  ctaText: LocalizedStringSchema,
});
```

## 10. Localized Tenant Architecture
- **Tenant Settings**: `defaultLocale: "pl"`, `supportedLocales: ["pl", "en"]`.
- **Routing Fallback**: If a tenant disables English, middleware auto-routes `en` requests to `pl`.

## 11. Dynamic Dictionary Loading
```typescript
// For non-CMS static UI elements
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  pl: () => import('./dictionaries/pl.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => dictionaries[locale]();
```

## 12. Translation Fallback System
- **Rendering Utility**:
```typescript
export function resolveTranslation(str: LocalizedString, lang: string): string {
  if (str[lang]) return str[lang];
  return str['en'] || Object.values(str)[0] || ''; // Fallback to English, then anything
}
```

## 13. Locale-Aware Formatting
- Handled via `Intl` browser APIs based on the `[lang]` parameter.

## 14. Currency Formatting
```typescript
export const formatCurrency = (amount: number, currency: string, lang: string) => {
  return new Intl.NumberFormat(lang, { style: 'currency', currency }).format(amount);
};
```

## 15. Date/Time Formatting
```typescript
export const formatDate = (date: Date, lang: string) => {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'full', timeStyle: 'short' }).format(date);
};
```

## 16. RTL-Readiness Strategy
- **HTML Attribute**: `<html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>`.
- **CSS Logical Properties**: Use `padding-inline-start` instead of `padding-left`.

## 17. Locale-Aware Typography
```css
/* Globals.css */
html[lang="pl"] {
  --font-body: 'Inter', sans-serif; /* Standard handling */
}
/* Future-proofing for Asian/Arabic fonts if required */
html[lang="ja"] {
  --font-body: 'Noto Sans JP', sans-serif;
}
```

## 18. AI Translation Workflow
1. **Trigger**: Admin clicks "Auto-Translate" in CMS.
2. **Payload**: Sends English JSON snippet to LLM.
3. **Prompt**: `Translate the following UI JSON values into natural, hospitable Polish. Preserve JSON structure.`
4. **Merge**: Updates the `pl` keys in the draft config.

## 19. Localized Metadata Generation
- **Open Graph**: Generates `/api/og?title=${encodedPolishTitle}`.
- **Alt Text**: Image schemas include `altText: LocalizedStringSchema`.

## 20. Localized Structured Data
```typescript
// JSON-LD injection
export function getRestaurantSchema(config, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": resolveTranslation(config.name, lang),
    "description": resolveTranslation(config.seo.description, lang),
    "menu": `https://domain.com/${lang}/menu`,
  };
}
```
