# Dynamic Restaurant Design System Architecture

This document defines the config-driven design system that powers the multi-tenant restaurant platform. It relies on a rigorous token structure, injected CSS variables, and fluid scaling to accommodate any visual aesthetic—from a sharp luxury sushi bar to a vibrant burger joint—without altering the core component logic.

## 1. Typography System
Typography is handled via fluid CSS clamps and abstracted Tailwind utility classes.
- **Tokens:** `--font-heading`, `--font-body`, `--font-accent`
- **Scale:** Uses a fluid typographic scale (`clamp()`) so text scales seamlessly from mobile to 4K displays.
- **Tailwind Map:** 
  - `font-heading` for heroes, section titles.
  - `font-body` for paragraphs and functional UI.
  - `font-accent` for price tags, timestamps, or decorative subheadings.
- **Dynamic Injection:** `next/font/google` loads the fonts defined in the tenant JSON, mapping them to the CSS variables at the `:root` level.

## 2. Spacing System
A strict 4pt baseline grid using CSS variables, with fluid spacing for macro-layouts.
- **Micro-spacing:** Handled by standard Tailwind classes (`p-4`, `m-2`) for component interiors.
- **Macro-spacing (Sections):** Handled by semantic variables: `--spacing-section-y`, `--spacing-container-x`.
- **Fluid Padding:** Use of `clamp()` for vertical section padding to ensure breathing room on desktop while staying compact on mobile.

## 3. Layout Grid System
A responsive 12-column CSS Grid architecture.
- **Tokens:** `--grid-cols`, `--grid-gap`
- **Bento Grid Layouts:** Dedicated abstract grid templates (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or custom asymmetric bento layouts) defined in block variants.
- **Container Max-Widths:** Dynamically set based on the theme (e.g., a "luxury" theme might use a wider, airier container (`max-w-7xl`), while a "cafe" theme might be more boxed (`max-w-5xl`)).

## 4. Border Radius System
The border radius dictates the "feel" of the brand.
- **Tokens:** `--radius` (base), `--radius-lg`, `--radius-xl`, `--radius-full`.
- **Dynamic Configurations:**
  - *Luxury/Sushi:* `--radius: 0px` (Sharp, elegant, modern).
  - *Burger Joint:* `--radius: 12px` or `16px` (Friendly, chunky, approachable).
  - *Cafe:* `--radius: 8px` (Warm, balanced).
- **Tailwind Integration:** Overrides standard `rounded-md`, `rounded-lg` utilities in `tailwind.config.ts`.

## 5. Shadow System
Shadows define elevation and depth, adapted to the tenant's dark/light mode preference.
- **Tokens:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`.
- **Dark Mode vs Light Mode:** Shadows in dark mode (like a moody Italian restaurant) shift from opacity-based black dropshadows to subtle colored glows or border-highlights to ensure visual separation.

## 6. Animation Philosophy
Animations should feel *cinematic, intentional, and performant*.
- **No generic bounce:** Everything must feel tailored and purposeful. 
- **Hardware Acceleration:** All animations exclusively target `transform` and `opacity`.
- **Orchestration:** Sibling elements stagger their entrance to guide the user's eye (e.g., Hero image reveals -> headline -> subheadline -> CTA).

## 7. Motion Hierarchy
Framer Motion is used with global preset variants.
- **Level 1: Micro-interactions:** Hover states, active states (CSS transitions, 150ms-300ms, `ease-out`).
- **Level 2: Component Entrances:** Fade-ups, slides (Framer Motion, `spring` physics, 400ms-600ms).
- **Level 3: Page/Section Transitions:** Parallax scrolling, mask reveals, staggering (Intersection Observers + Framer, orchestrated via parent `variants`).

## 8. Color Palette Architecture
All colors are defined as HSL values without the `hsl()` wrapper to allow Tailwind opacity modifiers (`bg-primary/50`).
- **Tokens:** 
  - `--background`, `--foreground` (Base canvas and text)
  - `--primary`, `--primary-foreground` (Brand CTA)
  - `--secondary`, `--secondary-foreground` (Subtle UI elements)
  - `--accent`, `--accent-foreground` (Highlights, sale items, special tags)
  - `--muted`, `--muted-foreground` (Borders, disabled text, secondary backgrounds)
- **Usage:** A sushi restaurant might have a `--background` of rich charcoal (`220 10% 10%`) with an `--accent` of vibrant salmon (`12 80% 60%`).

## 9. Theme Token Structure
A single JSON structure outputs the CSS variables injected at runtime.
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --radius: 0.5rem;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --motion-profile: spring-smooth;
}
```

## 10. Luxury Restaurant Visual Language
To support ultra-premium dining out of the box:
- **Negative Space:** Aggressive use of padding and margin. Let elements breathe.
- **Monochromatic Core:** Deep blacks, rich off-whites. The food photography is the only source of vibrant color.
- **Thin Lines:** 1px borders with low opacity (`border-white/10`) for dividers.
- **Typography:** High-contrast serif headings paired with highly legible, tracked-out sans-serif body text (`tracking-widest` for subheadings).

## 11. Mobile-First Responsive Strategy
- **Base constraints:** All base variants assume a 320px viewport. 
- **Hamburger/Overlay Menus:** Premium full-screen glassmorphic menu overlays for mobile, avoiding cramped native dropdowns.
- **Touch Targets:** Minimum 44x44px for all interactable elements.
- **Bento Stacking:** Bento grids collapse into a single column with horizontal scroll-snapping carousels for specific sections to save vertical space.

## 12. Image Usage Strategy
- **Full-Bleed:** Hero sections default to full viewport width/height (`w-full h-[100svh]`).
- **Object Fit:** `object-cover` applied universally to prevent distortion.
- **Overlays:** Automated gradients (e.g., `bg-gradient-to-t from-black/80 via-black/40 to-transparent`) overlay images to ensure text legibility regardless of the dynamic image loaded from the config.

## 13. Premium UI Patterns
- **Sticky Glass Header:** Morphs from transparent (at the top) to blurred/frosted glass (`backdrop-blur-md bg-background/80`) when scrolling down.
- **Magnetic Buttons:** Custom Framer Motion wrappers that slightly pull buttons toward the cursor on hover.
- **Custom Cursors:** Config-driven ability to replace the default cursor with a dynamic dot or a "Drag" label for carousels.
- **Parallax:** Subtle `y` axis translations on background images linked to `useScroll`.

## 14. Hover Interaction Strategy
- **Images:** Slight scale up (`scale-105`), with a slow `duration-700 ease-out`, and a dark overlay fade-in.
- **Text Links:** Underline expand from center or left-to-right (using `after:absolute` pseudo-elements).
- **Cards:** Subtle `y` axis lift (`-translate-y-1`) paired with a shadow bloom.

## 15. Section Transition Strategy
Eliminating hard cuts between disparate background colors.
- **Overlapping Elements:** An image from the Hero section breaking the boundary and overlapping the About section.
- **Masking/Clipping:** Using CSS `mask-image` or `clip-path` for slanted, curved, or soft-fade section dividers (configurable in tenant JSON).

## 16. shadcn/ui Integration Strategy
- **Component Anatomy:** Radix UI primitives power accessibility and state logic.
- **Tailwind Layering:** shadcn/ui components are generated into `/components/ui`. We do NOT modify their internal structure; we only modify `tailwind.config.ts` and the global CSS variables to reshape them.
- **Overrides:** If a button needs to be magnetic, we wrap the standard `<Button>` component in a `<MagneticWrapper>` rather than altering the core UI primitive.

## 17. Tailwind Token Organization
- **Config:** Custom utilities defined in `tailwind.config.ts`.
- **Extend:** `theme.extend` maps strictly to our CSS variables (e.g., `colors: { primary: 'hsl(var(--primary))' }`).
- **Plugins:** Integrated plugins for typography scales (`fluid-typography`), container queries, and animation resets.

## 18. Accessibility Strategy
- **Contrast Ratios:** The theme generator algorithm automatically checks and enforces WCAG 2.1 AA contrast ratios between `--primary` and `--primary-foreground`.
- **Focus Rings:** Unified `ring-2 ring-offset-2 ring-primary` applied to all interactive elements globally. Focus rings are exclusively visible for keyboard navigation (`focus-visible`).
- **Motion Preferences:** All Framer Motion variants respect the `prefers-reduced-motion` media query, automatically falling back to instant transitions or simple crossfades.
- **ARIA Compliance:** Relying on Radix UI (via shadcn) ensures all custom dropdowns, dialogs, and carousels are completely screen-reader compliant out of the box.
