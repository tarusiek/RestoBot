# CMS, Admin Dashboard & Content Management Architecture

This document outlines the production-ready architecture for the multi-tenant, AI-driven Headless CMS and Admin Dashboard. This system empowers restaurant owners to manage localized content (English/Polish), dynamically update visual blocks, handle reservations, and leverage AI for copy generation and theme adjustments—all seamlessly integrated with the React frontend through the `BlockResolver`.

---

## 1. CMS Architecture Overview
The CMS operates as an independent Next.js App Router application (or protected `/admin` route). It strictly consumes the Zod contracts defined in the frontend (e.g., `HeroDataSchema`, `MenuDataSchema`). It features a split-pane interface: a **Schema-Driven Form Builder** on the left and a **Live Visual Preview** on the right.

### Core Technologies
- **State Management**: Zustand (for complex local UI state, drag-and-drop) & React Query (server state, caching, optimistic updates).
- **Form Generation**: `@hookform/resolvers/zod` + dynamic form rendering based on the Zod AST.
- **Drag & Drop**: `@hello-pangea/dnd` for reordering sections, menu items, and gallery images.
- **Backend/API**: Proxies to Supabase/Firebase.

---

## 2. Multi-Tenant & Role-Based Access Control (RBAC) (`lib/admin/auth.ts`)
Each restaurant is a distinct tenant. Access is governed by strict RBAC, ensuring safety across franchises.

```typescript
import { z } from "zod";

export const RoleSchema = z.enum(["SuperAdmin", "Owner", "Manager", "Chef", "Editor"]);

export const UserPermissionSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: RoleSchema,
  locales: z.array(z.string()), // e.g., ["pl", "en"] - allows translators access to specific languages
});

export const checkPermission = (user: any, requiredRole: z.infer<typeof RoleSchema>) => {
  // Logic evaluating role hierarchy (e.g., Owner > Manager > Editor)
};
```

---

## 3. Localization & Content Translation Architecture (`components/admin/LocaleSwitcher.tsx`)
The CMS deeply understands the `LocalizedStringSchema`. When editing a text field, the admin can toggle between "PL" and "EN". 

### Translation Workflow:
1. **Side-by-Side Editing**: View the English string while typing the Polish string.
2. **AI Auto-Translate**: A magic wand icon next to any `LocalizedString` input triggers an API call to Gemini/OpenAI, translating the text into the target language while maintaining the restaurant's brand voice.

```tsx
'use client';
import { useAdminStore } from "@/store/adminStore";

export function LocaleSwitcher() {
  const { activeLocale, setActiveLocale, supportedLocales } = useAdminStore();
  
  return (
    <div className="flex gap-2 bg-muted p-1 rounded-md">
      {supportedLocales.map((locale) => (
        <button
          key={locale}
          onClick={() => setActiveLocale(locale)}
          className={`px-3 py-1 rounded text-sm font-bold uppercase ${activeLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
```

---

## 4. Visual Page Builder & Live Preview (`components/admin/VisualBuilder.tsx`)
The core of the CMS. It allows admins to add, remove, and reorder functional blocks (Hero, Menu, Gallery, Testimonials).

### Architecture Flow:
1. **Schema to Form**: The CMS reads `HeroDataSchema` and automatically generates inputs (Text fields for strings, Image uploaders for `MediaSchema`).
2. **Autosave & React Query**: Changes debounce and sync to the draft API.
3. **PostMessage iframe**: An `<iframe>` loads the frontend in preview mode. The CMS sends `window.postMessage` containing the updated draft JSON. The `BlockResolver` in the iframe instantly re-renders without refreshing.

```tsx
'use client';
import { useEffect, useRef } from "react";
import { useAdminStore } from "@/store/adminStore";

export function LivePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { draftConfig } = useAdminStore();

  // Sync draft configuration to the iframe in real-time
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_CONFIG_PREVIEW',
        payload: draftConfig
      }, '*');
    }
  }, [draftConfig]);

  return (
    <div className="w-full h-full bg-zinc-100 p-4 rounded-xl">
      <iframe 
        ref={iframeRef}
        src={`${process.env.NEXT_PUBLIC_SITE_URL}/api/preview`}
        className="w-full h-full rounded-lg shadow-2xl border-0"
      />
    </div>
  );
}
```

---

## 5. Draft/Publish Workflow & Revision History (`lib/admin/draft-system.ts`)
The system never overwrites the live site immediately. 

- **Draft State**: Saved continuously (autosave).
- **Revision History**: Every time "Publish" is clicked, the current active JSON is saved to a `Revisions` table.
- **Undo/Redo**: The admin can revert the live site to any previous snapshot JSON.

```typescript
export interface ConfigRevision {
  id: string;
  tenantId: string;
  publishedAt: Date;
  publishedBy: string; // User ID
  configSnapshot: any; // The full Zod-validated JSON
  commitMessage: string; // e.g., "Updated Winter Menu"
}
```

---

## 6. AI-Assisted Generation Architecture (`app/api/admin/ai/route.ts`)
Deep AI integration helps restaurant owners over technical hurdles.

- **Copy Generation**: Click "Generate Description" -> AI reads the `MenuData` and writes an SEO-optimized `AboutSection` text in Polish.
- **Theme Generation**: Admin types "Make it look like a moody Tokyo jazz bar" -> AI returns a partial JSON payload modifying CSS variables (colors, fonts, borders) that injects directly into the `ThemeEditor`.
- **Variant Recommendation**: AI detects high-quality food photography and suggests switching from `GalleryMasonry` to `GalleryCinematic`.

```typescript
export async function POST(req: Request) {
  const { prompt, context, targetSchema } = await req.json();
  // 1. Call Gemini/OpenAI
  // 2. Enforce Structured Outputs matching the target Zod schema
  // 3. Return validated JSON to the frontend form
}
```

---

## 7. Required Admin Modules

### A. Dashboard Home
Overview of booking metrics, recent activity (e.g., "Manager updated Menu at 14:00"), and AI insights ("Your Polish SEO title is missing for the Gallery page").

### B. Theme Editor
Visual interface for modifying the `ThemeTokens`. Includes color pickers for `primary`, `background`, radius sliders, and typography dropdowns (Google Fonts).

### C. Menu Manager
A specialized table/drag-and-drop interface mapping directly to the `MenuDataSchema`. Features bulk-editing for prices and dietary tags (Vegan, Gluten-free).

### D. Media Library
Centralized asset management. Integrates directly with Supabase Storage/AWS S3.
- **Features**: Auto-compression, WebP conversion, drag-and-drop uploads, alt-text generation via AI (for accessibility).

### E. SEO Manager
Form interface dedicated to `SEOMetaSchema`. Previews how the site looks in Google Search results and Twitter Cards. Highlights missing translations.

### F. Booking Manager
Calendar and list views of incoming reservations. Allows managers to manually approve, reject, or adjust table capacities. Modifies the `TimeSlotManager` availability algorithm.

### G. User & Role Management
Invite staff via email, assign roles (`Chef` can only access the Menu Manager, `Owner` accesses everything).

---

## 8. Form Builder & Dynamic Schema System (`components/admin/AutoForm.tsx`)
Instead of hardcoding hundreds of inputs, the CMS parses Zod schemas to render inputs.

```tsx
// Conceptual implementation of a recursive auto-form
import { z } from "zod";

export function AutoForm({ schema, value, onChange }: { schema: z.ZodTypeAny, value: any, onChange: (val: any) => void }) {
  // If schema is ZodString -> render <input type="text" />
  // If schema is LocalizedStringSchema -> render <LocaleSwitcher /> + <input />
  // If schema is ZodArray -> render DragDropContext + Add/Remove buttons
  // If schema is MediaSchema -> render <MediaLibraryPicker />
}
```

---

## 9. Security, Caching & Performance Architecture

- **Caching**: The live frontend heavily caches the compiled JSON configuration (Next.js ISR or Redis). When an admin clicks "Publish", the CMS calls a Next.js revalidation webhook (`revalidateTag('tenant-config')`), instantly updating edge nodes.
- **AI-Safe Validation**: Before any Draft is published to Live, the entire JSON blob is run through the global `RestaurantConfigSchema.parse()`. If the AI or admin bypassed validation and corrupted the JSON, the save is rejected, preventing frontend crashes.
- **Mobile Admin**: The CMS dashboard utilizes Tailwind's `md:hidden` patterns to provide a simplified view on mobile phones. (e.g., allowing a manager to quickly update a menu price from their phone without loading the full visual page builder).
