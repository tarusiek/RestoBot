# About / Story / Chef / Philosophy Section System Implementation

This document contains the production-ready React implementation of the AI-driven About Section ecosystem. It supports a diverse range of storytelling formats—from chef profiles and timeline histories to ingredient philosophies—across 8 distinct visual variants.

---

## 1. About Contracts & AI-Safe Validation (`contracts/About.ts`)
Strict Zod validation supports complex nested arrays for team members, timeline events, and awards, enabling the AI to construct rich narratives without hallucinating invalid React props.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";
import { MediaSchema } from "./Hero";

export const TeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  bio: z.string().optional(),
  media: MediaSchema.optional(),
});

export const TimelineEventSchema = z.object({
  id: z.string(),
  year: z.string(),
  title: z.string(),
  description: z.string(),
  media: MediaSchema.optional(),
});

export const AwardSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.string().optional(),
  issuer: z.string().optional(),
});

export const AboutDataSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  content: z.string().optional(), // Main narrative body
  quote: z.string().optional(),
  media: MediaSchema.optional(), // Primary image/video
  secondaryMedia: MediaSchema.optional(), // For asymmetric layouts
  team: z.array(TeamMemberSchema).optional(),
  timeline: z.array(TimelineEventSchema).optional(),
  awards: z.array(AwardSchema).optional(),
});

export type AboutData = z.infer<typeof AboutDataSchema>;
export type AboutProps = BaseSectionProps<AboutData>;
```

---

## 2. Motion Architecture (`lib/about-animations.ts`)
Orchestrates staggered typography reveals and scroll-linked image scaling using Framer Motion.

```typescript
import { Variants } from "framer-motion";

export const textRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 50, damping: 20 } 
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

export const imageParallaxVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
  }
};
```

---

## 3. Variant: Editorial Luxury (`components/blocks/about/AboutEditorial.tsx`)
A magazine-style spread utilizing sticky sidebars and high negative space. Ideal for fine dining philosophies.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { textRevealVariants, staggerContainer, imageParallaxVariants } from "@/lib/about-animations";

export default function AboutEditorial({ data }: AboutProps) {
  return (
    <section className="w-full py-32 bg-background">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Sticky Left Column */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={textRevealVariants} className="font-heading text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                {data.headline}
              </motion.h2>
              {data.subheadline && (
                <motion.p variants={textRevealVariants} className="font-body text-sm uppercase tracking-[0.2em] text-muted-foreground mb-8">
                  {data.subheadline}
                </motion.p>
              )}
              {data.awards && data.awards.length > 0 && (
                <motion.div variants={staggerContainer} className="mt-12 flex flex-col gap-4 border-l border-primary pl-6">
                  {data.awards.map(award => (
                    <div key={award.id}>
                      <p className="font-heading font-bold">{award.title}</p>
                      <p className="font-body text-xs text-muted-foreground">{award.issuer} {award.year}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Scrolling Right Column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-16">
            {data.media && (
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={imageParallaxVariants} className="w-full aspect-[4/5] md:aspect-[16/10] overflow-hidden rounded-[var(--radius)]">
                <MediaRenderer media={data.media} className="w-full h-full object-cover" />
              </motion.div>
            )}

            {data.content && (
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={textRevealVariants} className="prose prose-lg dark:prose-invert">
                <p className="font-body leading-relaxed text-foreground/80 md:text-xl md:leading-loose">
                  {data.content}
                </p>
              </motion.div>
            )}

            {data.secondaryMedia && (
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={imageParallaxVariants} className="w-3/4 ml-auto aspect-square overflow-hidden rounded-[var(--radius)] mt-8">
                <MediaRenderer media={data.secondaryMedia} className="w-full h-full object-cover" />
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
```

---

## 4. Variant: Split Screen Story (`components/blocks/about/AboutSplitScreen.tsx`)
A 50/50 responsive layout that perfectly balances a narrative on one side and immersive media on the other.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { textRevealVariants, staggerContainer } from "@/lib/about-animations";

export default function AboutSplitScreen({ data }: AboutProps) {
  return (
    <section className="relative w-full min-h-[80svh] flex flex-col lg:flex-row bg-background">
      
      {/* Media Half */}
      <div className="w-full lg:w-1/2 min-h-[50vh] relative">
        {data.media && (
          <MediaRenderer media={data.media} className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* Content Half */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-muted/10">
        <motion.div 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }} 
          variants={staggerContainer}
          className="max-w-xl"
        >
          <motion.h2 variants={textRevealVariants} className="font-heading text-4xl md:text-6xl font-bold mb-6">
            {data.headline}
          </motion.h2>
          
          {data.subheadline && (
            <motion.p variants={textRevealVariants} className="font-heading italic text-xl text-primary mb-8">
              "{data.subheadline}"
            </motion.p>
          )}

          {data.content && (
            <motion.p variants={textRevealVariants} className="font-body text-foreground/80 leading-relaxed mb-8">
              {data.content}
            </motion.p>
          )}

          {data.quote && (
             <motion.blockquote variants={textRevealVariants} className="border-l-4 border-primary pl-6 py-2 my-8 font-body font-medium italic text-foreground">
               "{data.quote}"
             </motion.blockquote>
          )}
        </motion.div>
      </div>

    </section>
  );
}
```

---

## 5. Variant: Timeline Journey (`components/blocks/about/AboutTimeline.tsx`)
Ideal for heritage restaurants or founders wanting to showcase their history step-by-step using a central tracking line.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";

export default function AboutTimeline({ data }: AboutProps) {
  if (!data.timeline?.length) return null;

  return (
    <section className="w-full py-24 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <div className="text-center mb-20">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">{data.headline}</h2>
          {data.subheadline && <p className="font-body text-muted-foreground">{data.subheadline}</p>}
        </div>

        <div className="relative border-l-2 border-border/50 ml-4 md:mx-auto md:border-l-0">
          {/* Desktop Central Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2" />

          {data.timeline.map((event, index) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`relative flex flex-col md:flex-row items-center justify-between mb-16 ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Timeline Dot */}
              <div className="absolute left-[-5px] md:left-1/2 w-3 h-3 bg-primary rounded-full md:-translate-x-1/2 top-2 md:top-auto z-10 ring-4 ring-background" />

              <div className="w-full md:w-5/12 pl-8 md:pl-0" />
              
              <div className={`w-full md:w-5/12 pl-8 md:pl-0 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                <span className="font-heading text-2xl font-bold text-primary block mb-2">{event.year}</span>
                <h3 className="font-heading text-xl font-semibold mb-3">{event.title}</h3>
                <p className="font-body text-sm text-foreground/70 leading-relaxed">{event.description}</p>
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

## 6. Variant: Chef Showcase (`components/blocks/about/AboutChef.tsx`)
A focused profile layout designed to highlight the executive chef or core team members with bio cards.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function AboutChef({ data }: AboutProps) {
  if (!data.team?.length) return null;

  return (
    <section className="w-full py-24 bg-muted/20">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-5xl font-bold mb-6">{data.headline}</h2>
            {data.content && <p className="font-body text-foreground/70 leading-relaxed">{data.content}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {data.team.map((member, i) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group flex flex-col"
            >
              <div className="relative w-full aspect-[3/4] rounded-[var(--radius)] overflow-hidden mb-6">
                {member.media ? (
                  <MediaRenderer media={member.media} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full bg-border/50 flex items-center justify-center">
                    <span className="font-heading text-4xl text-muted-foreground">{member.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h3 className="font-heading text-2xl font-bold">{member.name}</h3>
              <p className="font-body text-sm uppercase tracking-widest text-primary mb-4">{member.role}</p>
              {member.bio && <p className="font-body text-sm text-foreground/70 line-clamp-4">{member.bio}</p>}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
```

---

## 7. Variant: Minimal Japanese (`components/blocks/about/AboutMinimal.tsx`)
Emphasizes philosophy, strict grid alignment, vertical text orientation effects, and an overall Zen aesthetic.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";

export default function AboutMinimal({ data }: AboutProps) {
  return (
    <section className="w-full py-32 bg-background flex justify-center">
      <div className="container max-w-4xl px-8 flex flex-col md:flex-row items-center gap-16 relative">
        
        {/* Subtle decorative stamp */}
        <div className="absolute top-0 right-8 w-12 h-12 border-2 border-red-500/20 rounded-full flex items-center justify-center hidden md:flex">
          <span className="w-8 h-8 bg-red-500/10 rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2"
        >
          {data.media && (
            <div className="aspect-[3/4] w-full max-w-[300px] mx-auto overflow-hidden">
               <img src={data.media.url} alt="Philosophy" className="w-full h-full object-cover" />
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
        >
          <h2 className="font-heading text-3xl md:text-4xl tracking-[0.2em] uppercase mb-8 text-foreground">{data.headline}</h2>
          {data.content && (
            <p className="font-body text-sm leading-[2.5] tracking-wide text-foreground/80 mb-8 whitespace-pre-line">
              {data.content}
            </p>
          )}
        </motion.div>

      </div>
    </section>
  );
}
```

---

## 8. Variant: Dark Cinematic (`components/blocks/about/AboutDarkCinematic.tsx`)
Forces a dark theme context, using heavy shadows and high-contrast typography over deep backgrounds. Ideal for nightclubs or speakeasies.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function AboutDarkCinematic({ data }: AboutProps) {
  return (
    <section className="w-full py-32 bg-zinc-950 text-zinc-50 border-y border-zinc-900 relative overflow-hidden">
      
      {/* Abstract Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8"
        >
          {data.headline}
        </motion.h2>

        {data.media && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full aspect-video rounded-[var(--radius)] overflow-hidden my-12 shadow-2xl shadow-black"
          >
            <MediaRenderer media={data.media} className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
          </motion.div>
        )}

        {data.content && (
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-body text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed"
          >
            {data.content}
          </motion.p>
        )}
      </div>
    </section>
  );
}
```

---

## 9. Variant: Fullscreen Narrative (`components/blocks/about/AboutFullscreen.tsx`)
A completely immersive, full-screen scrolling section utilizing `useScroll` for a parallax fade effect linking text and imagery.

```tsx
'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function AboutFullscreen({ data }: AboutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <section ref={containerRef} className="relative w-full h-[150vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Parallax Background */}
        {data.media && (
          <motion.div style={{ y }} className="absolute inset-0 z-0">
            <MediaRenderer media={data.media} className="w-full h-[120%] object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          </motion.div>
        )}

        {/* Narrative Content */}
        <motion.div style={{ opacity }} className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
           <h2 className="font-heading text-6xl md:text-8xl font-bold text-white mb-8 drop-shadow-xl">{data.headline}</h2>
           {data.content && (
             <p className="font-body text-xl md:text-3xl text-white/90 leading-relaxed font-light drop-shadow-md">
               {data.content}
             </p>
           )}
           {data.quote && (
             <p className="mt-12 font-heading text-2xl md:text-4xl italic text-primary">
               "{data.quote}"
             </p>
           )}
        </motion.div>

      </div>
    </section>
  );
}
```

---

## 10. Variant: Cafe Warm (`components/blocks/about/AboutCafe.tsx`)
A cozy layout utilizing warm colors, rounded borders, and overlapping elements to mimic a scrapbook or physical menu feel.

```tsx
'use client';

import { motion } from "framer-motion";
import { AboutProps } from "@/contracts/About";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function AboutCafe({ data }: AboutProps) {
  return (
    <section className="w-full py-24 bg-[hsl(35,30%,96%)] dark:bg-background">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="bg-white dark:bg-muted/10 rounded-[calc(var(--radius)+1rem)] p-8 md:p-16 shadow-xl shadow-black/5 relative">
          
          <div className="flex flex-col-reverse md:flex-row gap-12 items-center">
            
            {/* Content Container */}
            <div className="w-full md:w-1/2 flex flex-col text-center md:text-left">
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 text-foreground">{data.headline}</h2>
              {data.subheadline && <p className="font-heading text-xl text-primary mb-6 italic">{data.subheadline}</p>}
              
              {data.content && (
                <p className="font-body text-foreground/70 leading-loose mb-8">
                  {data.content}
                </p>
              )}
            </div>

            {/* Overlapping Media */}
            <div className="w-full md:w-1/2 relative">
               {data.media && (
                 <motion.div 
                   whileHover={{ rotate: -2, scale: 1.02 }}
                   className="w-full aspect-square rounded-[calc(var(--radius)+0.5rem)] overflow-hidden shadow-lg border-8 border-white dark:border-muted/20 rotate-3 transition-transform"
                 >
                   <MediaRenderer media={data.media} className="w-full h-full object-cover" />
                 </motion.div>
               )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
```
