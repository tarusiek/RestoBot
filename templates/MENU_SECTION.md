# Menu Section System Implementation

This document contains the production-ready React implementation of the AI-driven Menu Section ecosystem. It provides robust category filtering, interactive food cards, and 6 distinct visual variants optimized for dynamic restaurant configurations.

---

## 1. Menu Contracts & AI-Safe Validation (`contracts/Menu.ts`)
Strict typing ensures the AI-generated menu JSON remains structured, preventing rendering errors while supporting complex dietary and pricing data.

```typescript
import { z } from "zod";
import { BaseSectionProps } from "./BaseSection";
import { MediaSchema } from "./Hero"; // Reuses media validation

export const DietaryTagSchema = z.enum(["vegan", "vegetarian", "gluten-free", "spicy", "halal"]);

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.string(), // String allows for "$18", "Market Price", or "¥2000"
  dietary: z.array(DietaryTagSchema).optional(),
  media: MediaSchema.optional(),
  popular: z.boolean().optional(),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  items: z.array(MenuItemSchema),
});

export const MenuDataSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  categories: z.array(MenuCategorySchema),
});

export type MenuItemType = z.infer<typeof MenuItemSchema>;
export type MenuCategoryType = z.infer<typeof MenuCategorySchema>;
export type MenuData = z.infer<typeof MenuDataSchema>;
export type MenuProps = BaseSectionProps<MenuData>;
```

---

## 2. Menu Motion & Filtering System (`components/blocks/menu/useMenuFilter.ts`)
A custom hook that handles category state and orchestrates Framer Motion animations when filtering food items.

```typescript
import { useState, useMemo } from "react";
import { MenuCategoryType } from "@/contracts/Menu";

export function useMenuFilter(categories: MenuCategoryType[]) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredCategories = useMemo(() => {
    if (activeCategory === "all") return categories;
    return categories.filter(c => c.id === activeCategory);
  }, [categories, activeCategory]);

  return { activeCategory, setActiveCategory, filteredCategories };
}

// Framer Motion variants
export const menuListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const menuItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};
```

---

## 3. Interactive Category Navigation (`components/blocks/menu/CategoryNav.tsx`)
A sticky, horizontal scrolling navigation bar for mobile, and a clean flex layout for desktop.

```tsx
'use client';

import { MenuCategoryType } from "@/contracts/Menu";

interface CategoryNavProps {
  categories: MenuCategoryType[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeCategory, onSelect }: CategoryNavProps) {
  return (
    <div className="sticky top-20 z-30 w-full bg-background/90 backdrop-blur-md py-4 mb-8 border-b border-border/50">
      <div className="container mx-auto px-4 md:px-8 flex overflow-x-auto hide-scrollbar gap-4 items-center">
        <button
          onClick={() => onSelect("all")}
          className={`whitespace-nowrap px-6 py-2 rounded-full font-body text-sm font-semibold transition-all ${
            activeCategory === "all" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Menus
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-body text-sm font-semibold transition-all ${
              activeCategory === category.id ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {category.title}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Variant: Bento Grid (`components/blocks/menu/MenuBento.tsx`)
Creates an asymmetric grid. Items marked `popular` span two columns or rows. Highly visual.

```tsx
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { MenuProps } from "@/contracts/Menu";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";
import { CategoryNav } from "./CategoryNav";
import { useMenuFilter, menuListVariants, menuItemVariants } from "./useMenuFilter";

export default function MenuBento({ data }: MenuProps) {
  const { activeCategory, setActiveCategory, filteredCategories } = useMenuFilter(data.categories);

  return (
    <section className="w-full min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 md:px-8">
        {data.headline && <h2 className="font-heading text-5xl md:text-6xl font-bold text-center mb-4">{data.headline}</h2>}
        {data.subheadline && <p className="font-body text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{data.subheadline}</p>}
        
        <CategoryNav categories={data.categories} activeCategory={activeCategory} onSelect={setActiveCategory} />

        <div className="mt-12">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category) => (
              <motion.div key={category.id} initial="hidden" animate="show" exit="exit" variants={menuListVariants} className="mb-16">
                <h3 className="font-heading text-3xl font-bold mb-8">{category.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[250px]">
                  {category.items.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={menuItemVariants}
                      className={`relative group overflow-hidden rounded-[var(--radius)] bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors ${
                        item.popular && item.media ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"
                      }`}
                    >
                      {item.media && (
                        <div className="absolute inset-0 z-0">
                          <MediaRenderer media={item.media} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </div>
                      )}
                      
                      <div className={`absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end h-full ${item.media ? 'text-white' : 'text-foreground'}`}>
                        <div className="flex justify-between items-end gap-4">
                          <div>
                            {item.popular && <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Popular</span>}
                            <h4 className="font-heading text-xl font-bold">{item.name}</h4>
                            {item.description && <p className="font-body text-sm opacity-80 mt-2 line-clamp-2">{item.description}</p>}
                          </div>
                          <span className="font-heading text-xl font-bold bg-background/20 backdrop-blur-md px-3 py-1 rounded-md">{item.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
```

---

## 5. Variant: Classic List (`components/blocks/menu/MenuClassic.tsx`)
Traditional fine-dining layout. Elegant dotted leaders connecting item names to prices.

```tsx
'use client';

import { motion } from "framer-motion";
import { MenuProps } from "@/contracts/Menu";
import { useMenuFilter, menuListVariants, menuItemVariants } from "./useMenuFilter";

export default function MenuClassic({ data }: MenuProps) {
  const { filteredCategories } = useMenuFilter(data.categories);

  return (
    <section className="w-full py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        {data.headline && <h2 className="font-heading text-4xl md:text-5xl uppercase tracking-widest text-center mb-16">{data.headline}</h2>}

        {filteredCategories.map((category) => (
          <motion.div key={category.id} initial="hidden" whileInView="show" viewport={{ once: true }} variants={menuListVariants} className="mb-20">
            <h3 className="font-heading text-2xl font-bold text-center border-b border-border pb-4 mb-8 uppercase tracking-[0.2em] text-primary">{category.title}</h3>
            
            <div className="flex flex-col gap-6">
              {category.items.map((item) => (
                <motion.div key={item.id} variants={menuItemVariants} className="flex flex-col w-full group">
                  <div className="flex items-baseline w-full">
                    <h4 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                    <div className="flex-1 mx-4 border-b-2 border-dotted border-border/60 relative -top-1" />
                    <span className="font-heading text-lg font-semibold text-foreground">{item.price}</span>
                  </div>
                  {item.description && <p className="font-body text-sm text-muted-foreground mt-1 max-w-[80%]">{item.description}</p>}
                  {item.dietary && (
                    <div className="flex gap-2 mt-2">
                      {item.dietary.map(diet => (
                        <span key={diet} className="text-[10px] uppercase tracking-wider text-accent border border-accent/30 px-2 py-0.5 rounded-sm">{diet}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

---

## 6. Variant: Luxury Editorial (`components/blocks/menu/MenuLuxury.tsx`)
Magazine-style layout. High negative space, asymmetrical columns, large serif typography, and selective imagery.

```tsx
'use client';

import { motion } from "framer-motion";
import { MenuProps } from "@/contracts/Menu";
import { MediaRenderer } from "@/components/infrastructure/MediaRenderer";

export default function MenuLuxury({ data }: MenuProps) {
  return (
    <section className="w-full py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="mb-24 md:w-1/2">
          {data.headline && <h2 className="font-heading text-6xl md:text-8xl tracking-tighter text-foreground mb-6">{data.headline}</h2>}
          {data.subheadline && <p className="font-body text-lg text-muted-foreground leading-relaxed">{data.subheadline}</p>}
        </div>

        {data.categories.map((category, index) => (
          <div key={category.id} className="mb-32 flex flex-col md:flex-row gap-16 md:gap-24 items-start">
            
            {/* Category Title Column */}
            <div className={`md:w-1/3 sticky top-32 ${index % 2 !== 0 ? 'md:order-2' : ''}`}>
              <h3 className="font-heading text-4xl md:text-5xl italic text-primary mb-4">{category.title}</h3>
              {category.description && <p className="font-body text-sm uppercase tracking-widest text-muted-foreground">{category.description}</p>}
            </div>

            {/* Items Column */}
            <div className={`md:w-2/3 flex flex-col gap-12 ${index % 2 !== 0 ? 'md:order-1' : ''}`}>
              {category.items.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex gap-8 group"
                >
                  {item.media && (
                    <div className="w-24 h-32 md:w-32 md:h-40 shrink-0 overflow-hidden rounded-[var(--radius)]">
                       <MediaRenderer media={item.media} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h4 className="font-heading text-2xl md:text-3xl text-foreground mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
                    {item.description && <p className="font-body text-foreground/60 leading-relaxed mb-4">{item.description}</p>}
                    <span className="font-heading text-xl">{item.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 7. Variant: Minimal Japanese (`components/blocks/menu/MenuMinimalJapanese.tsx`)
Extremely sparse, relying on strict vertical alignment and subtle red accent details (stamps). Rejects heavy imagery in favor of clean space.

```tsx
'use client';

import { motion } from "framer-motion";
import { MenuProps } from "@/contracts/Menu";

export default function MenuMinimalJapanese({ data }: MenuProps) {
  return (
    <section className="w-full py-20 bg-background flex flex-col items-center">
      <div className="w-full max-w-3xl px-8 relative">
        
        {/* Subtle Decorative Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border/30 -translate-x-1/2 hidden md:block" />

        {data.categories.map((category) => (
          <div key={category.id} className="mb-24 relative z-10">
            <div className="flex justify-center mb-12">
               <h3 className="font-heading text-2xl tracking-[0.3em] uppercase bg-background px-6 text-foreground">{category.title}</h3>
            </div>
            
            <div className="flex flex-col gap-8">
              {category.items.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-2 bg-background"
                >
                  <div className="flex-1 md:pr-8">
                    <h4 className="font-body font-medium text-lg text-foreground tracking-wide">{item.name}</h4>
                    {item.description && <p className="font-body text-xs text-muted-foreground mt-2">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    {item.popular && (
                      <span className="w-4 h-4 rounded-full border border-red-500/50 flex items-center justify-center">
                         <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      </span>
                    )}
                    <span className="font-body text-lg text-foreground/80">{item.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 8. Variant: Dark Modern (`components/blocks/menu/MenuDarkModern.tsx`)
Forces a dark theme context specifically for this section. High contrast, neon-inspired hover states, perfect for bars/nightclubs.

```tsx
'use client';

import { motion } from "framer-motion";
import { MenuProps } from "@/contracts/Menu";

export default function MenuDarkModern({ data }: MenuProps) {
  return (
    <section className="w-full py-24 bg-zinc-950 text-zinc-50 border-t border-zinc-900">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="font-heading text-5xl font-black uppercase text-center mb-16 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
          {data.headline || "The Menu"}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {data.categories.map((category) => (
            <div key={category.id} className="relative">
              <h3 className="font-heading text-2xl font-bold mb-8 text-primary uppercase">{category.title}</h3>
              <div className="flex flex-col gap-6 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-zinc-800 pl-6">
                
                {category.items.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ x: 10 }}
                    className="relative group cursor-pointer"
                  >
                    {/* Hover indicator pip */}
                    <span className="absolute -left-[29px] top-3 w-2 h-2 bg-zinc-800 rounded-full group-hover:bg-primary transition-colors duration-300" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading text-xl font-bold text-zinc-100 group-hover:text-primary transition-colors">{item.name}</h4>
                        {item.description && <p className="font-body text-sm text-zinc-400 mt-1">{item.description}</p>}
                      </div>
                      <span className="font-heading text-lg font-bold text-zinc-300">{item.price}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```
