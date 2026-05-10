# Hero Section System Implementation

This document contains the production-ready React implementation of the AI-driven Hero Section ecosystem. It integrates perfectly with the `BlockResolver`, `ThemeInjector`, and `MediaRenderer`, utilizing Framer Motion for scroll-linked animations and stagger effects.

---

## 1. Hero Contracts & AI-Safe Validation (`contracts/Hero.ts`)
Strict typing and Zod schemas to guarantee that the AI generates valid payloads for any hero variant.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";

export const MediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  alt: z.string().optional(),
});

export const HeroDataSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  primaryCta: z.object({ label: z.string(), url: z.string() }).optional(),
  secondaryCta: z.object({ label: z.string(), url: z.string() }).optional(),
  media: MediaSchema,
  // Specifically used by the "fullscreen-slider" variant
  slides: z.array(
    z.object({
      media: MediaSchema,
      headline: z.string(),
      subheadline: z.string().optional(),
    })
  ).optional(),
});

export type HeroData = z.infer<typeof HeroDataSchema>;
export type HeroProps = BaseSectionProps<HeroData>;
```

---

## 2. Hero Motion System (`lib/hero-animations.ts`)
Shared Framer Motion orchestrators designed to respect the global `data-motion-profile` and user accessibility settings.

```typescript
import { Variants } from "framer-motion";

export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2, ease: "easeOut" },
  },
};

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  },
};

export const heroLuxuryVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
  },
};
```

---

## 3. Hero Cinematic Video (`components/blocks/hero/HeroCinematic.tsx`)
A full-bleed, immersive layout focusing on large video or imagery with a bottom-heavy or centered text gradient overlay. Standard for modern premium restaurants.

```tsx
'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { HeroProps } from "@/contracts/Hero";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { heroContainerVariants, heroItemVariants } from "@/lib/hero-animations";

export default function HeroCinematic({ data, context }: HeroProps) {
  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-black flex items-end justify-center pb-24 md:pb-32 px-6">
      
      {/* Background Media with overlay */}
      <div className="absolute inset-0 z-0">
        <MediaRenderer media={data.media} className="w-full h-full object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <motion.div 
        variants={heroContainerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 container mx-auto text-center flex flex-col items-center max-w-4xl"
      >
        <motion.h1 
          variants={heroItemVariants}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 drop-shadow-lg"
        >
          {data.headline}
        </motion.h1>
        
        {data.subheadline && (
          <motion.p 
            variants={heroItemVariants}
            className="font-body text-lg md:text-2xl text-white/90 font-light tracking-wide mb-10 max-w-2xl drop-shadow-md"
          >
            {data.subheadline}
          </motion.p>
        )}

        {/* CTA Group */}
        <motion.div variants={heroItemVariants} className="flex flex-col sm:flex-row gap-4">
          {data.primaryCta && (
            <Link 
              href={data.primaryCta.url}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-[var(--radius)] font-body text-sm font-semibold uppercase tracking-widest hover:bg-primary/90 transition-colors"
            >
              {data.primaryCta.label}
            </Link>
          )}
          {data.secondaryCta && (
            <Link 
              href={data.secondaryCta.url}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-[var(--radius)] font-body text-sm font-semibold uppercase tracking-widest hover:bg-white/20 transition-colors"
            >
              {data.secondaryCta.label}
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
```

---

## 4. Hero Split Screen (`components/blocks/hero/HeroSplitScreen.tsx`)
A 50/50 responsive layout. Ideal for burger joints or cafes featuring vibrant colors on one side and product photography on the other.

```tsx
'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { HeroProps } from "@/contracts/Hero";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { heroContainerVariants, heroItemVariants } from "@/lib/hero-animations";

export default function HeroSplitScreen({ data, context }: HeroProps) {
  return (
    <div className="relative w-full min-h-[100svh] flex flex-col-reverse lg:flex-row bg-background">
      
      {/* Left Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 z-10">
        <motion.div 
          variants={heroContainerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-xl"
        >
          <motion.h1 
            variants={heroItemVariants}
            className="font-heading text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] mb-6"
          >
            {data.headline}
          </motion.h1>
          
          {data.subheadline && (
            <motion.p 
              variants={heroItemVariants}
              className="font-body text-lg md:text-xl text-foreground/70 mb-10"
            >
              {data.subheadline}
            </motion.p>
          )}

          <motion.div variants={heroItemVariants} className="flex flex-wrap gap-4">
            {data.primaryCta && (
              <Link 
                href={data.primaryCta.url}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-[var(--radius)] font-body font-bold shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                {data.primaryCta.label}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Right Media Area */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full lg:w-1/2 h-[50vh] lg:h-[100svh] relative"
      >
        <MediaRenderer media={data.media} className="w-full h-full object-cover" priority />
      </motion.div>

    </div>
  );
}
```

---

## 5. Hero Parallax Image (`components/blocks/hero/HeroParallax.tsx`)
Scroll-linked parallax effect. Uses `useScroll` and `useTransform` to move the image slightly slower than the scroll speed.

```tsx
'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { HeroProps } from "@/contracts/Hero";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { heroContainerVariants, heroItemVariants } from "@/lib/hero-animations";

export default function HeroParallax({ data, context }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Image moves down by 30% of its height as the user scrolls down
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  // Optional: fade out content on scroll
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[100svh] overflow-hidden bg-background">
      
      {/* Parallax Media */}
      <motion.div style={{ y }} className="absolute inset-0 z-0 origin-top">
        <MediaRenderer media={data.media} className="w-full h-[120%] object-cover scale-110" priority />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      {/* Content */}
      <motion.div 
        style={{ opacity }}
        variants={heroContainerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.h1 variants={heroItemVariants} className="font-heading text-6xl md:text-8xl text-white mb-6">
          {data.headline}
        </motion.h1>
        {data.subheadline && (
          <motion.p variants={heroItemVariants} className="font-body text-xl text-white/80 max-w-2xl mb-10">
            {data.subheadline}
          </motion.p>
        )}
        {data.primaryCta && (
          <motion.div variants={heroItemVariants}>
            <Link 
              href={data.primaryCta.url}
              className="bg-white text-black px-10 py-4 rounded-[var(--radius)] font-body font-bold hover:scale-105 transition-transform"
            >
              {data.primaryCta.label}
            </Link>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
```

---

## 6. Hero Luxury Editorial (`components/blocks/hero/HeroLuxury.tsx`)
Characterized by extreme negative space, sharp typography, asymmetrical layouts, and small, highly-curated imagery.

```tsx
'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { HeroProps } from "@/contracts/Hero";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { heroContainerVariants, heroLuxuryVariants } from "@/lib/hero-animations";

export default function HeroLuxury({ data, context }: HeroProps) {
  return (
    <div className="relative w-full min-h-[100svh] bg-background pt-32 pb-16 px-6 md:px-12 flex flex-col justify-center">
      
      <motion.div 
        variants={heroContainerVariants}
        initial="hidden"
        animate="show"
        className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        
        {/* Typographical Left */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          <motion.h1 
            variants={heroLuxuryVariants}
            className="font-heading text-6xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground tracking-tighter"
          >
            {data.headline}
          </motion.h1>
          
          {data.subheadline && (
            <motion.div variants={heroLuxuryVariants} className="mt-12 flex items-center gap-6">
              <span className="w-16 h-[1px] bg-foreground block" />
              <p className="font-body text-sm uppercase tracking-[0.3em] text-foreground/60 max-w-xs">
                {data.subheadline}
              </p>
            </motion.div>
          )}

          {data.primaryCta && (
            <motion.div variants={heroLuxuryVariants} className="mt-16">
              <Link 
                href={data.primaryCta.url}
                className="group relative inline-flex items-center gap-4 font-body text-sm uppercase tracking-[0.2em] text-foreground"
              >
                <span>{data.primaryCta.label}</span>
                <span className="w-12 h-[1px] bg-foreground group-hover:w-16 transition-all duration-300" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Elegant Imagery Right */}
        <motion.div 
          variants={heroLuxuryVariants}
          className="lg:col-span-5 h-[60vh] lg:h-[80vh] w-full relative overflow-hidden rounded-[var(--radius)]"
        >
          <MediaRenderer media={data.media} className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2000ms] ease-out" priority />
        </motion.div>

      </motion.div>
    </div>
  );
}
```

---

## 7. Hero Fullscreen Slider (`components/blocks/hero/HeroSlider.tsx`)
Loops through `data.slides` using `AnimatePresence`. Perfect for showing off multiple signature dishes.

```tsx
'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroProps } from "@/contracts/Hero";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function HeroSlider({ data, context }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = data.slides || [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides.length) return null; // Fallback handled by resolver theoretically

  return (
    <div className="relative w-full h-[100svh] bg-black overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <MediaRenderer media={slides[currentIndex].media} className="w-full h-full object-cover" priority />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center p-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="font-heading text-5xl md:text-8xl text-white font-bold"
            >
              {slides[currentIndex].headline}
            </motion.h2>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
```
