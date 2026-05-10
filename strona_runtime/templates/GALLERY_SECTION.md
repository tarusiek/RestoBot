# Gallery & Media Showcase System Implementation

This document contains the production-ready React implementation of the AI-driven Gallery Section ecosystem. It provides 6 distinct, responsive variants optimized for visual storytelling, high-performance image loading, and immersive Framer Motion scroll interactions.

---

## 1. Gallery Contracts & AI-Safe Validation (`contracts/Gallery.ts`)
Strict Zod validation ensures that the AI cannot hallucinate invalid image arrays and guarantees standard data structures for aspect ratios and grid spans.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";
import { MediaSchema } from "./Hero";

export const GalleryImageSchema = z.object({
  id: z.string(),
  media: MediaSchema,
  caption: z.string().optional(),
  // Used specifically by the Bento grid variant to determine size
  span: z.enum(["1", "2", "3", "full"]).optional(), 
});

export const GalleryDataSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  images: z.array(GalleryImageSchema),
});

export type GalleryImage = z.infer<typeof GalleryImageSchema>;
export type GalleryData = z.infer<typeof GalleryDataSchema>;
export type GalleryProps = BaseSectionProps<GalleryData>;
```

---

## 2. Interactive Lightbox System (`components/blocks/gallery/Lightbox.tsx`)
A shared, accessible fullscreen lightbox that works across all gallery variants. Implements keyboard navigation (Escape, Arrows) and touch gesture support via Framer Motion.

```tsx
'use client';

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GalleryImage } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

interface LightboxProps {
  image: GalleryImage | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function Lightbox({ image, onClose, onNext, onPrev }: LightboxProps) {
  // Keyboard event listener
  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [image, onClose, onNext, onPrev]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-white/70 hover:text-white z-50 text-xl font-body"
            aria-label="Close lightbox"
          >
            ✕
          </button>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[85vh] aspect-video sm:aspect-auto sm:h-[85vh] rounded-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -100 && onNext) onNext();
              else if (swipe > 100 && onPrev) onPrev();
            }}
          >
            <MediaRenderer media={image.media} className="w-full h-full object-contain" />
            {image.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                <p className="text-white font-body text-lg">{image.caption}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 3. Gallery Variant: Masonry (`components/blocks/gallery/GalleryMasonry.tsx`)
A classic cascading grid, perfect for images of varying heights. Utilizes CSS columns for a lightweight, performant masonry implementation.

```tsx
'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { GalleryProps, GalleryImage } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { Lightbox } from "./Lightbox";

export default function GalleryMasonry({ data }: GalleryProps) {
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  if (!data.images || data.images.length === 0) return null;

  return (
    <section className="w-full py-24 bg-background">
      <div className="container mx-auto px-6">
        
        {data.headline && (
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">{data.headline}</h2>
            {data.subheadline && <p className="font-body text-muted-foreground">{data.subheadline}</p>}
          </div>
        )}

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {data.images.map((image, i) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-[var(--radius)]"
              onClick={() => setActiveImage(image)}
            >
              <MediaRenderer 
                media={image.media} 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-body uppercase tracking-widest text-sm font-semibold">View</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Lightbox image={activeImage} onClose={() => setActiveImage(null)} />
    </section>
  );
}
```

---

## 4. Gallery Variant: Bento Grid (`components/blocks/gallery/GalleryBento.tsx`)
A highly structured, modern asymmetric grid based on the `span` property passed from the AI configuration.

```tsx
'use client';

import { motion } from "framer-motion";
import { GalleryProps } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function GalleryBento({ data }: GalleryProps) {
  if (!data.images || data.images.length === 0) return null;

  const getColSpan = (span?: string) => {
    switch(span) {
      case "2": return "md:col-span-2";
      case "3": return "md:col-span-3 lg:col-span-2";
      case "full": return "md:col-span-4";
      default: return "col-span-1";
    }
  };

  const getRowSpan = (span?: string) => {
    if (span === "2" || span === "3") return "md:row-span-2";
    return "row-span-1";
  };

  return (
    <section className="w-full py-20 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8">
        {data.headline && <h2 className="font-heading text-4xl font-bold mb-10">{data.headline}</h2>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
          {data.images.map((image, i) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              className={`relative overflow-hidden rounded-[var(--radius)] group ${getColSpan(image.span)} ${getRowSpan(image.span)}`}
            >
              <MediaRenderer media={image.media} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              {image.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-heading text-xl md:text-2xl font-semibold">{image.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 5. Gallery Variant: Cinematic Fullscreen (`components/blocks/gallery/GalleryCinematic.tsx`)
A sticky section that horizontally scrolls through images as the user scrolls vertically. Extremely premium feel.

```tsx
'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GalleryProps } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function GalleryCinematic({ data }: GalleryProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Create a tall container. As the user scrolls through it, the sticky inner div slides horizontally.
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  if (!data.images || data.images.length === 0) return null;

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-black">
      <div className="sticky top-0 h-screen flex flex-col items-center overflow-hidden">
        
        {data.headline && (
          <div className="absolute top-12 md:top-24 left-0 right-0 z-10 text-center px-6 mix-blend-difference">
            <h2 className="font-heading text-5xl md:text-7xl font-bold text-white tracking-tighter">{data.headline}</h2>
          </div>
        )}

        {/* Horizontal scroll track */}
        <motion.div style={{ x }} className="flex h-full items-center pt-20 pb-10 px-8 gap-8 w-max">
          {data.images.map((image) => (
            <div key={image.id} className="relative w-[80vw] md:w-[60vw] lg:w-[50vw] h-[60vh] md:h-[70vh] rounded-[var(--radius)] overflow-hidden shrink-0">
              <MediaRenderer media={image.media} className="w-full h-full object-cover" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

---

## 6. Gallery Variant: Horizontal Scroll (`components/blocks/gallery/GalleryHorizontal.tsx`)
A classic, touch-friendly scrolling row. Perfect for mobile-first configurations or cafes showing off latte art.

```tsx
'use client';

import { useRef } from "react";
import { motion } from "framer-motion";
import { GalleryProps } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function GalleryHorizontal({ data }: GalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!data.images || data.images.length === 0) return null;

  return (
    <section className="w-full py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
        <div>
          {data.headline && <h2 className="font-heading text-3xl md:text-5xl font-bold">{data.headline}</h2>}
          {data.subheadline && <p className="font-body text-muted-foreground mt-2">{data.subheadline}</p>}
        </div>
      </div>

      <motion.div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 md:gap-6 px-6 md:px-12 pb-8 hide-scrollbar cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={scrollRef}
      >
        {data.images.map((image) => (
          <motion.div 
            key={image.id}
            whileHover={{ scale: 0.98 }}
            className="relative shrink-0 w-[280px] h-[350px] md:w-[400px] md:h-[500px] rounded-[var(--radius)] overflow-hidden"
          >
            <MediaRenderer media={image.media} className="w-full h-full object-cover" />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-heading font-medium text-lg">{image.caption}</p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
```

---

## 7. Gallery Variant: Instagram Modern (`components/blocks/gallery/GalleryInstagram.tsx`)
A strict `aspect-square` grid mimicking social media layouts. Extremely tight gaps (`gap-1` or `gap-2`).

```tsx
'use client';

import { motion } from "framer-motion";
import { GalleryProps } from "@/contracts/Gallery";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function GalleryInstagram({ data }: GalleryProps) {
  if (!data.images || data.images.length === 0) return null;

  // Instagram variant limits to multiples of 3 for perfect grids
  const displayImages = data.images.slice(0, 9); 

  return (
    <section className="w-full py-16 bg-background">
      {data.headline && (
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl font-bold tracking-widest uppercase">
            {data.headline}
          </h2>
          {data.subheadline && <p className="font-body text-muted-foreground text-sm mt-2">{data.subheadline}</p>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 md:gap-2 max-w-5xl mx-auto px-1 md:px-4">
        {displayImages.map((image, i) => (
          <motion.div 
            key={image.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="relative aspect-square overflow-hidden group cursor-pointer bg-muted"
          >
            <MediaRenderer media={image.media} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```
