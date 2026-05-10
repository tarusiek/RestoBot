# UI Primitives & Design Tokens Architecture

## 1. Shared UI Library Architecture
- **Location**: `packages/ui` (Turborepo shared workspace).
- **Stack**: React, Radix UI, Framer Motion, Tailwind CSS, CVA (Class Variance Authority).
- **Goal**: Provide unstyled, accessible logic primitives and highly styled, theme-aware building blocks.

## 2. Design Token System
- **Structure**: Tokens map CSS variables injected at the tenant root (`layout.tsx`).
- **Layers**: 
  - Semantic Tokens (`--primary`, `--background`).
  - Scale Tokens (`--radius-md`, `--spacing-4`).

## 3. Primitive Component Architecture
- **Radix UI**: Underlying logic (focus management, keyboard navigation, ARIA states).
- **Tailwind**: Utility classes layered on Radix primitives.
- **Example**: `Button` = `<Radix.Slot />` + `cva()` styles.

## 4. Variant Composition Strategy
```typescript
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius)] transition-colors focus-visible:ring-2",
  {
    variants: {
      intent: { primary: "bg-primary text-primary-foreground", outline: "border border-input hover:bg-accent" },
      size: { sm: "h-9 px-3", lg: "h-11 px-8" }
    },
    defaultVariants: { intent: "primary", size: "lg" }
  }
);
```

## 5. Theme Token Pipeline
1. `ThemeTokens` JSON stored in DB.
2. RSC reads JSON.
3. `<ThemeInjector>` renders `<style>` mapping JSON to `--css-vars`.
4. Tailwind config consumes `var(--css-vars)`.

## 6. Typography Token System
- `--font-heading`: E.g., 'Playfair Display' (Luxury), 'Inter' (Modern).
- `--font-body`: E.g., 'Lato', 'Roboto'.
- Tailwind extended classes: `font-heading`, `font-body`.

## 7. Color Token Architecture
- `--background`, `--foreground`.
- `--primary`, `--primary-foreground`.
- `--muted`, `--muted-foreground`.
- `--border`, `--ring`.
- Expressed as HSL values for programmatic opacity (`hsl(var(--primary) / 0.5)`).

## 8. Radius/Spacing Token System
- `--radius`: Base border radius (e.g., `0` for brutalist/minimal, `0.5rem` for friendly cafe).
- Scales: `rounded-sm`, `rounded-md`, `rounded-lg` dynamically calculate via `calc(var(--radius) - 2px)`.

## 9. Shadow Token System
- `--shadow-sm`, `--shadow-lg`, `--shadow-xl`.
- Dynamic based on theme (dark mode shifts shadows to subtle white/glow or deep black).

## 10. Motion Token System
- Controlled by `motionProfile` (e.g., `"cinematic"`).
- Injected via `useMotion()` React hook, not CSS, to bind directly with Framer Motion spring physics.

## 11. Shared Layout Primitives
- `<Container>`: Max-width wrapper clamping content.
- `<Section>`: Standard vertical padding (`py-12 md:py-24`).
- `<Grid>`: Standard CSS grid layouts (bento, masonry).

## 12. Shared Typography Primitives
- `<Heading level={1|2|3|4}>`: Maps to correct `h*` tag, applies `font-heading`.
- `<Text variant="lead|body|muted">`: Standard body copy.

## 13. Shared Overlay Primitives
- `<Sheet>`: Off-canvas menus (Radix Dialog).
- `<Drawer>`: Bottom-sheet interactions for mobile touch.

## 14. Shared Modal/Dialog Primitives
- `<Dialog>`: Accessible modal popups (booking confirmations, lightbox).
- `<AlertDialog>`: Destructive action confirmations.

## 15. Shared Navigation Primitives
- `<NavigationMenu>`: Accessible, hover-intent routing.
- `<StickyHeader>`: Uses IntersectionObserver to toggle glassmorphism.

## 16. Shared Form Primitives
- `<Form>`, `<FormItem>`, `<FormField>`, `<Input>`, `<Textarea>`, `<Select>`.
- Bound strictly to `react-hook-form` and `zod`.

## 17. Shared Media Primitives
- `<MediaRenderer>`: Auto-switches between `<Image>` and `<video>`.
- `<BlurImage>`: Integrates Base64 placeholders.

## 18. Shared Animation Wrappers
- `<FadeIn>`: Intersection observer opacity reveal.
- `<StaggerContainer>`: Parent wrapper for staggered children.
- `<Parallax>`: Scroll-linked translation wrapper.

## 19. Accessibility Primitives
- `<VisuallyHidden>`: Screen-reader text only.
- Radix UI manages `aria-expanded`, `aria-hidden`, and FocusTrap automatically.

## 20. Variant Registry Architecture
- UI variant maps stored as constant objects:
```typescript
export const HeroVariants = {
  cinematic: dynamic(() => import('./HeroCinematic')),
  split: dynamic(() => import('./HeroSplit')),
};
```

## 21. Compound Component Strategy
```tsx
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```
Allows maximum layout flexibility within the `BlockResolver`.

## 22. Responsive Primitive Strategy
- All primitives mobile-first by default.
- Layout variants shift via Tailwind breakpoints (`flex-col md:flex-row`).

## 23. Dark Mode Architecture
- `next-themes` provider.
- `dark:` Tailwind variant.
- AI theme generation outputs explicit dark-mode HSL overrides in JSON config.

## 24. Localization-Safe UI Primitives
- `white-space: pre-wrap` and `break-words` enforced on `<Heading>` and `<Text>` to prevent overflow in verbose languages (e.g., Polish vs English).

## 25. Token Synchronization Strategy
- Database `ThemeTokens` JSON perfectly mirrors `tailwind.config.ts` theme extension names.

## 26. Tailwind Integration Architecture
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: { primary: "hsl(var(--primary))" },
    borderRadius: { lg: "var(--radius)" },
    fontFamily: { heading: ["var(--font-heading)"], body: ["var(--font-body)"] }
  }
}
```

## 27. shadcn Integration Strategy
- Customized shadcn/ui components copied into `packages/ui/src/components`.
- Modified to consume our specific `ThemeTokens` and `motionProfile` hooks.

## 28. Component Extensibility Architecture
- `className` prop strictly merged via `clsx` and `tailwind-merge` (`cn` utility) across all primitives.

## 29. Shared Documentation Strategy
- Storybook deployed per PR to visualize UI changes against multiple mock `ThemeTokens` (e.g., viewing a Button in "Luxury" vs "Burger" themes).

## 30. UI Scalability Architecture
- Atomic design principles.
- Strict tree-shaking via `package.json` exports mapping.
- Zero business logic inside `packages/ui` (strictly presentational).
