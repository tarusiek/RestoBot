# Animation, Motion & Interaction Orchestration Architecture

This document contains the production-ready architecture for the AI-driven Motion ecosystem. It dictates how the restaurant platform handles cinematic transitions, scroll-driven storytelling, and luxury interactions using Framer Motion, all while strictly adhering to GPU-safe performance rules and accessibility requirements.

---

## 1. Motion Profile Architecture & AI Contracts (`contracts/Motion.ts`)
The entire animation ecosystem is driven by the `motionProfile` key within the tenant's configuration. The AI selects a global profile, which dynamically alters spring physics, transition durations, and stagger delays across the entire application without rewriting any component logic.

```typescript
import { z } from "zod";

export const MotionProfileSchema = z.enum([
  "cinematic-luxury", // Slow, sweeping fades, heavy easeOut
  "minimal-japanese", // Zen-like, subtle vertical floats, slight delays
  "snappy-modern",    // Quick spring physics, high stiffness
  "cafe-warm",        // Friendly bounces, soft easing
  "dark-atmospheric", // Brooding, slow opacity reveals, blur transitions
  "editorial-smooth", // Magazine-style staggered typographic reveals
  "high-energy",      // Fast, aggressive scaling, high-contrast pops
  "reduced-motion",   // Accessibility override: instantly swaps to simple opacity fades
]);

export type MotionProfile = z.infer<typeof MotionProfileSchema>;

// Internal architecture definition of a profile
export interface MotionTokens {
  transition: {
    base: any; // Framer Motion transition object
    slow: any;
    fast: any;
  };
  spring: {
    bouncy: any;
    stiff: any;
    smooth: any;
  };
  stagger: {
    fast: number;
    base: number;
    slow: number;
  };
}
```

---

## 2. Dynamic Animation Config System (`lib/motion/profiles.ts`)
Maps the `MotionProfileSchema` to actual Framer Motion physics. This config is consumed by a global React Context and injected into components.

```typescript
import { MotionTokens } from "@/contracts/Motion";

export const cinematicLuxury: MotionTokens = {
  transition: {
    base: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
    slow: { duration: 1.2, ease: [0.25, 1, 0.5, 1] },
    fast: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
  spring: {
    bouncy: { type: "spring", stiffness: 100, damping: 20 },
    stiff: { type: "spring", stiffness: 300, damping: 30 },
    smooth: { type: "spring", stiffness: 50, damping: 25 },
  },
  stagger: { fast: 0.05, base: 0.15, slow: 0.3 },
};

// Other profiles follow the same interface...
```

---

## 3. Global Orchestration & The `useMotion` Hook
To ensure components don't hardcode animation physics, all UI components request their variants from a central orchestration hook.

```tsx
import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { useThemeConfig } from "@/components/infrastructure/ThemeProvider";
import { getMotionTokens } from "@/lib/motion/profiles";

export function useMotion() {
  const { motionProfile } = useThemeConfig();
  const shouldReduceMotion = useReducedMotion();

  const tokens = useMemo(() => {
    if (shouldReduceMotion) return getMotionTokens("reduced-motion");
    return getMotionTokens(motionProfile);
  }, [motionProfile, shouldReduceMotion]);

  // Generate reusable variants based on the active profile
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: tokens.transition.base }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: tokens.stagger.base }
    }
  };

  return { tokens, fadeUp, staggerContainer };
}
```

---

## 4. Scroll Animation & Parallax Architecture
We utilize Framer Motion's `useScroll` and `useTransform` to tie element positions to the scroll wheel. All parallax strictly manipulates `translateY` (via `y`) and forces `translateZ(0)` for hardware acceleration.

```tsx
'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track scroll progress within the specific element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Map 0-1 scroll progress to -20% to 20% Y translation
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div ref={ref} className="relative w-full h-[60vh] overflow-hidden rounded-[var(--radius)]">
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[140%] -top-[20%]">
        <img src={src} alt={alt} className="w-full h-full object-cover will-change-transform" style={{ transform: "translateZ(0)" }} />
      </motion.div>
    </div>
  );
}
```

---

## 5. Viewport Observation Architecture (`whileInView`)
Instead of complex `IntersectionObserver` React wrappers, we rely on Framer Motion's `whileInView` for scroll-reveals. We utilize the `margin` prop to trigger animations *before* the element enters the visible viewport to prevent popping.

```tsx
<motion.div
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-10% 0px" }} // Triggers slightly before crossing threshold
  variants={staggerContainer}
>
  <motion.h2 variants={fadeUp}>Our Philosophy</motion.h2>
  <motion.p variants={fadeUp}>Only the freshest ingredients.</motion.p>
</motion.div>
```

---

## 6. Layout Animation & Shared Element Transitions
When switching Menu Categories (e.g., "Starters" -> "Mains"), the DOM nodes unmount and remount. We use `AnimatePresence` combined with `layout` to fluidly shift cards around without thrashing.

```tsx
import { motion, AnimatePresence } from "framer-motion";

export function MenuGrid({ activeCategory, items }) {
  return (
    <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {items.filter(i => i.category === activeCategory).map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="will-change-transform"
          >
            <MenuCard data={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## 7. Magnetic Interaction Architecture (`components/motion/MagneticButton.tsx`)
A luxury interaction where standard buttons or CTAs slightly "pull" towards the user's cursor as they hover near it. Extremely common in Awwwards-winning websites.

```tsx
'use client';

import { useRef, useState } from "react";
import { motion } from "framer-motion";

export function MagneticButton({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Move the button 20% of the distance from the center
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.button>
  );
}
```

---

## 8. Mobile-Safe Animation Strategy & GPU Acceleration
- **No Layout Thrashing**: We strictly prohibit animating CSS properties like `width`, `height`, `top`, `left`, `margin`, or `padding`.
- **GPU-Safe Transforms**: All animations must use `x`, `y`, `scale`, `rotate`, or `opacity`. This ensures the mobile device's GPU handles the rendering compositing, leaving the main thread free for JavaScript execution.
- **`will-change` Hinting**: Components undergoing heavy physics manipulation utilize `will-change-transform` to pre-allocate browser resources.
- **Scroll Hijacking Prevention**: We absolutely do not hijack native mobile scrolling. All parallax and scroll effects are passive observers (`useScroll`).

---

## 9. Animation State Management & Page Transitions
When moving between pages (e.g., Home -> Reservation), we use `AnimatePresence` wrapping the Next.js `children` inside the root `template.tsx` to orchestrate smooth page wipe transitions.

```tsx
// app/[lang]/template.tsx
'use client';

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
```

---

## 10. AI-Safe Motion Schema Architecture
Because the AI dictates the layout via JSON, it cannot write Framer Motion code. Instead, the AI configures variants and intentions.

If the AI JSON includes:
```json
{
  "variant": "cinematic-fullscreen",
  "motionIntent": "aggressive-reveal"
}
```
The `BlockResolver` translates `"aggressive-reveal"` into the specific `snappy-modern` physics profile at runtime, entirely decoupling the AI's abstract intent from the actual React DOM rendering. This ensures the AI can never crash the browser by specifying invalid transition timings or CSS properties.
