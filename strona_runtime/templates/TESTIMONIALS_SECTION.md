# Testimonials & Social Proof System Implementation

This document contains the production-ready React implementation of the AI-driven Testimonial Section ecosystem. It provides 6 distinct, responsive variants optimized for building trust, showcasing social proof, and rendering dynamic reviews with Framer Motion.

---

## 1. Testimonial Contracts & AI-Safe Validation (`contracts/Testimonials.ts`)
Strict Zod validation guarantees that ratings, review text, and social proof statistics are correctly typed, allowing safe rendering across any variant.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";
import { MediaSchema } from "./Hero";

export const StatisticSchema = z.object({
  value: z.string(), // e.g., "4.9/5", "10k+"
  label: z.string(), // e.g., "Google Reviews", "Happy Diners"
});

export const TestimonialSchema = z.object({
  id: z.string(),
  author: z.string(),
  role: z.string().optional(), // e.g., "Local Guide" or "Food Critic"
  text: z.string(),
  rating: z.number().min(1).max(5).optional(),
  source: z.string().optional(), // e.g., "Yelp", "Michelin Guide"
  avatar: MediaSchema.optional(),
  video: MediaSchema.optional(), // specifically for the video variant
});

export const TestimonialsDataSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  testimonials: z.array(TestimonialSchema),
  statistics: z.array(StatisticSchema).optional(),
});

export type TestimonialType = z.infer<typeof TestimonialSchema>;
export type TestimonialsData = z.infer<typeof TestimonialsDataSchema>;
export type TestimonialsProps = BaseSectionProps<TestimonialsData>;
```

---

## 2. Dynamic Star Rating System (`components/blocks/testimonials/StarRating.tsx`)
A reusable visual component that reads the numerical rating and outputs SVG stars, fully themed.

```tsx
import { motion } from "framer-motion";

interface StarRatingProps {
  rating?: number;
  className?: string;
}

export function StarRating({ rating = 5, className = "" }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className={`flex items-center gap-1 text-primary ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return (
            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        }
        return <span key={i} className="w-4 h-4" />;
      })}
    </div>
  );
}
```

---

## 3. Variant: Editorial (`components/blocks/testimonials/TestimonialsEditorial.tsx`)
Magazine-style pull-quotes. Uses heavy typography, asymmetric layouts, and focuses on one or two major reviews (e.g., from food critics).

```tsx
'use client';

import { motion } from "framer-motion";
import { TestimonialsProps } from "@/contracts/Testimonials";

export default function TestimonialsEditorial({ data }: TestimonialsProps) {
  if (!data.testimonials.length) return null;

  // Editorial focuses heavily on the first two reviews
  const reviews = data.testimonials.slice(0, 2);

  return (
    <section className="w-full py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {reviews.map((review, i) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className={`flex flex-col ${i === 1 ? 'md:mt-32' : ''}`} // Staggered masonry feel
            >
              <div className="text-primary font-heading text-8xl leading-none opacity-20 mb-[-2rem]">"</div>
              <h3 className="font-heading text-3xl md:text-5xl leading-tight text-foreground mb-8">
                {review.text}
              </h3>
              
              <div className="mt-auto border-t border-border pt-6 flex justify-between items-center">
                <div>
                  <p className="font-heading font-bold text-lg uppercase tracking-widest">{review.author}</p>
                  {review.source && <p className="font-body text-sm text-muted-foreground">{review.source}</p>}
                </div>
                {review.source === "Michelin Guide" && (
                  <span className="text-primary font-bold text-2xl">✤</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 4. Variant: Carousel (`components/blocks/testimonials/TestimonialsCarousel.tsx`)
A highly interactive, draggable horizontal carousel. Excellent for high-volume customer reviews.

```tsx
'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { TestimonialsProps } from "@/contracts/Testimonials";
import { StarRating } from "./StarRating";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function TestimonialsCarousel({ data }: TestimonialsProps) {
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [data.testimonials]);

  if (!data.testimonials.length) return null;

  return (
    <section className="w-full py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-6 mb-16 text-center">
        {data.headline && <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">{data.headline}</h2>}
        {data.subheadline && <p className="font-body text-muted-foreground">{data.subheadline}</p>}
      </div>

      <motion.div ref={carouselRef} className="cursor-grab active:cursor-grabbing px-6">
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width - 48 }}
          className="flex gap-8 w-max mx-auto"
        >
          {data.testimonials.map((review) => (
            <motion.div 
              key={review.id}
              className="w-[300px] md:w-[400px] bg-background border border-border p-8 rounded-[var(--radius)] shadow-sm shrink-0 flex flex-col"
            >
              <StarRating rating={review.rating} className="mb-6" />
              <p className="font-body text-foreground/80 leading-relaxed mb-8 flex-1">"{review.text}"</p>
              
              <div className="flex items-center gap-4">
                {review.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <MediaRenderer media={review.avatar} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary shrink-0">
                    {review.author.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-heading font-bold text-sm">{review.author}</h4>
                  {review.source && <span className="font-body text-xs text-muted-foreground">{review.source}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
```

---

## 5. Variant: Video Testimonials (`components/blocks/testimonials/TestimonialsVideo.tsx`)
Puts customer-generated video content front and center. Relies on the `<MediaRenderer />` to handle video looping or playback.

```tsx
'use client';

import { motion } from "framer-motion";
import { TestimonialsProps } from "@/contracts/Testimonials";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function TestimonialsVideo({ data }: TestimonialsProps) {
  const videoReviews = data.testimonials.filter(t => t.video);
  if (!videoReviews.length) return null;

  return (
    <section className="w-full py-20 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold">{data.headline || "Hear From Our Guests"}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoReviews.map((review, i) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative aspect-[9/16] rounded-[var(--radius)] overflow-hidden group"
            >
              {/* Note: In a real app, MediaRenderer might need an 'autoPlay' prop explicitly if not standard */}
              <MediaRenderer media={review.video!} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                 <p className="text-white font-body text-sm italic mb-4 line-clamp-3">"{review.text}"</p>
                 <h4 className="text-white font-heading font-bold">{review.author}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 6. Variant: Statistics & Social Proof (`components/blocks/testimonials/TestimonialsStatistics.tsx`)
High-impact, numerical trust builders. "10,000+ Guests Served". Uses Framer Motion for number counting or fade-ups.

```tsx
'use client';

import { motion } from "framer-motion";
import { TestimonialsProps } from "@/contracts/Testimonials";

export default function TestimonialsStatistics({ data }: TestimonialsProps) {
  if (!data.statistics?.length) return null;

  return (
    <section className="w-full py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 max-w-5xl">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-primary-foreground/20">
          {data.statistics.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: "spring" }}
              className="flex flex-col items-center text-center pt-8 md:pt-0 px-4"
            >
              <span className="font-heading text-6xl md:text-7xl font-bold tracking-tighter mb-4 drop-shadow-sm">
                {stat.value}
              </span>
              <span className="font-body text-sm md:text-base uppercase tracking-widest opacity-80">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
        
        {data.testimonials[0] && (
          <div className="mt-24 text-center max-w-2xl mx-auto border-t border-primary-foreground/20 pt-12">
            <p className="font-heading text-2xl md:text-3xl italic mb-6">"{data.testimonials[0].text}"</p>
            <p className="font-body text-sm font-bold tracking-widest uppercase">— {data.testimonials[0].author}</p>
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## 7. Variant: Luxury Minimal (`components/blocks/testimonials/TestimonialsLuxury.tsx`)
A fading cross-fade implementation displaying a single review at a time. Total focus, zero clutter.

```tsx
'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestimonialsProps } from "@/contracts/Testimonials";

export default function TestimonialsLuxury({ data }: TestimonialsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (data.testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % data.testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [data.testimonials.length]);

  if (!data.testimonials.length) return null;

  return (
    <section className="w-full py-40 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <span className="text-primary font-serif text-6xl mb-8 block">✧</span>
            <p className="font-heading text-3xl md:text-5xl leading-snug text-foreground mb-12">
              {data.testimonials[index].text}
            </p>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {data.testimonials[index].author}
              {data.testimonials[index].source && ` • ${data.testimonials[index].source}`}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
```

---

## 8. SEO & Schema.org Integration Strategy
While visual components are generated dynamically, we inject structured data to ensure local restaurants get stars in Google Search results.

```tsx
// This helper is utilized in the layout or page wrapper to inject JSON-LD
export function generateReviewSchema(testimonials: TestimonialType[], brandName: string) {
  const validReviews = testimonials.filter(t => t.rating);
  if (!validReviews.length) return null;

  const averageRating = validReviews.reduce((acc, t) => acc + (t.rating || 5), 0) / validReviews.length;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": brandName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": validReviews.length
    },
    "review": validReviews.map(t => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": t.author },
      "reviewRating": { "@type": "Rating", "ratingValue": t.rating },
      "reviewBody": t.text
    }))
  };
}
```
