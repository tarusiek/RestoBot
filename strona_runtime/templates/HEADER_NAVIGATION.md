# Header & Navigation System Implementation

This document contains the production-ready React implementation of the Layout, Header, and Navigation layer. It adheres to the established component contracts, utilizing Framer Motion for cinematic reveals, Tailwind CSS for theme-aware styling, and dynamic variant resolution.

---

## 1. Header Contracts (`contracts/Layout.ts`)
Strict typing for the data fed into the Header Resolver from the global JSON configuration.

```typescript
export interface NavItem {
  label: string;
  url: string;
}

export interface HeaderConfig {
  variant: "transparent-sticky" | "solid-standard" | "hidden-overlay" | "luxury-minimal" | "cinematic-floating";
  brandName: string;
  logoUrl?: string;
  navItems: NavItem[];
  primaryCta?: {
    label: string;
    url: string;
  };
}

export interface HeaderProps {
  config: HeaderConfig;
}
```

---

## 2. Scroll & Motion Hooks (`hooks/useHeaderScroll.ts`)
A custom hook to detect scroll position and direction for advanced header transitions (e.g., morphing from transparent to glassmorphic).

```typescript
import { useState, useEffect } from 'react';

export function useHeaderScroll(threshold = 50) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > threshold);
      
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold]);

  return { isScrolled, scrollDirection };
}
```

---

## 3. Layout Wrapper (`components/layouts/LayoutResolver.tsx`)
The primary wrapper injected inside the Next.js `page.tsx` that wraps the `BlockResolver` content with the resolved Header and Footer.

```tsx
import { ReactNode } from "react";
import { HeaderResolver } from "@/components/resolvers/HeaderResolver";
import { GlobalContext } from "@/contracts/BaseSection";

interface LayoutResolverProps {
  context: GlobalContext;
  children: ReactNode;
}

export function LayoutResolver({ context, children }: LayoutResolverProps) {
  // Extract header config from global data
  const headerConfig = {
    variant: context.theme.layout.headerVariant,
    brandName: context.brandName,
    logoUrl: context.globalData?.logoUrl,
    navItems: context.globalData?.navigation || [],
    primaryCta: context.globalData?.primaryCta,
  };

  return (
    <div className="relative flex min-h-screen flex-col w-full">
      <HeaderResolver config={headerConfig} />
      
      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>

      {/* FooterResolver would go here */}
    </div>
  );
}
```

---

## 4. Header Resolver (`components/resolvers/HeaderResolver.tsx`)
Safely maps the AI-generated layout variant string to a React header component.

```tsx
'use client';

import dynamic from "next/dynamic";
import { HeaderConfig } from "@/contracts/Layout";

const HeaderVariants = {
  "transparent-sticky": dynamic(() => import('@/components/layouts/header/TransparentStickyHeader')),
  "solid-standard": dynamic(() => import('@/components/layouts/header/SolidStandardHeader')),
  "hidden-overlay": dynamic(() => import('@/components/layouts/header/HiddenOverlayHeader')),
  "luxury-minimal": dynamic(() => import('@/components/layouts/header/LuxuryMinimalHeader')),
  "cinematic-floating": dynamic(() => import('@/components/layouts/header/CinematicFloatingHeader')),
};

export function HeaderResolver({ config }: { config: HeaderConfig }) {
  const Component = HeaderVariants[config.variant] || HeaderVariants["transparent-sticky"];
  
  return <Component config={config} />;
}
```

---

## 5. Mobile Navigation Overlay (`components/layouts/header/MobileNavOverlay.tsx`)
A scalable, accessible fullscreen overlay driven by Framer Motion. Handles stagger animations and dynamic CTA injection.

```tsx
'use client';

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { HeaderConfig } from "@/contracts/Layout";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  config: HeaderConfig;
}

const overlayVariants = {
  closed: { opacity: 0, clipPath: "circle(0% at 100% 0)" },
  open: { 
    opacity: 1, 
    clipPath: "circle(150% at 100% 0)",
    transition: { type: "spring", stiffness: 20, restDelta: 2 }
  }
};

const navListVariants = {
  closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const navItemVariants = {
  closed: { opacity: 0, y: 50 },
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export function MobileNavOverlay({ isOpen, onClose, config }: MobileNavProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={overlayVariants}
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col justify-center items-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.nav variants={navListVariants} className="flex flex-col gap-8 text-center">
            {config.navItems.map((item, idx) => (
              <motion.div key={idx} variants={navItemVariants}>
                <Link 
                  href={item.url} 
                  onClick={onClose}
                  className="font-heading text-4xl font-light tracking-wide text-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}

            {config.primaryCta && (
              <motion.div variants={navItemVariants} className="mt-8">
                <Link
                  href={config.primaryCta.url}
                  onClick={onClose}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-[var(--radius)] font-body uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
                >
                  {config.primaryCta.label}
                </Link>
              </motion.div>
            )}
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 6. The Toggle Button (`components/layouts/header/MenuToggle.tsx`)
Accessible animated hamburger toggle.

```tsx
'use client';
import { motion } from "framer-motion";

interface MenuToggleProps {
  isOpen: boolean;
  toggle: () => void;
  className?: string;
}

export function MenuToggle({ isOpen, toggle, className = "" }: MenuToggleProps) {
  return (
    <button
      onClick={toggle}
      className={`relative z-50 w-10 h-10 flex flex-col justify-center items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md ${className}`}
      aria-label="Toggle Menu"
      aria-expanded={isOpen}
    >
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }}
        className="w-6 h-[2px] bg-foreground block origin-center transition-colors"
      />
      <motion.span
        animate={{ opacity: isOpen ? 0 : 1 }}
        className="w-6 h-[2px] bg-foreground block transition-colors"
      />
      <motion.span
        animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -8 : 0 }}
        className="w-6 h-[2px] bg-foreground block origin-center transition-colors"
      />
    </button>
  );
}
```

---

## 7. Header Implementation: Transparent Sticky (`components/layouts/header/TransparentStickyHeader.tsx`)
The most common variant. Starts transparent over a hero image, morphs to a solid glassmorphism bar on scroll.

```tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeaderProps } from "@/contracts/Layout";
import { useHeaderScroll } from "@/hooks/useHeaderScroll";
import { MobileNavOverlay } from "./MobileNavOverlay";
import { MenuToggle } from "./MenuToggle";

export default function TransparentStickyHeader({ config }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isScrolled, scrollDirection } = useHeaderScroll(50);

  // Hidden when scrolling down, visible when scrolling up or at top
  const isHidden = isScrolled && scrollDirection === "down" && !isOpen;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: isHidden ? -100 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out ${
          isScrolled 
            ? "bg-background/80 backdrop-blur-md shadow-sm py-4" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="relative z-50 focus-visible:ring-2 ring-primary rounded-sm">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.brandName} className="h-8 md:h-10 object-contain" />
            ) : (
              <span className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {config.brandName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {config.navItems.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.url}
                className="font-body text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors focus-visible:ring-2 ring-primary rounded-sm px-2 py-1"
              >
                {item.label}
              </Link>
            ))}

            {config.primaryCta && (
              <Link
                href={config.primaryCta.url}
                className="ml-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-[var(--radius)] font-body text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity focus-visible:ring-2 ring-offset-2 ring-primary"
              >
                {config.primaryCta.label}
              </Link>
            )}
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <MenuToggle isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />
          </div>

        </div>
      </motion.header>

      {/* Mobile Overlay */}
      <MobileNavOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} config={config} />
    </>
  );
}
```

---

## 8. Header Implementation: Cinematic Floating (`components/layouts/header/CinematicFloatingHeader.tsx`)
A pill-shaped, floating navigation bar ideal for modern, high-end burger or cafe variants.

```tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeaderProps } from "@/contracts/Layout";
import { useHeaderScroll } from "@/hooks/useHeaderScroll";
import { MobileNavOverlay } from "./MobileNavOverlay";
import { MenuToggle } from "./MenuToggle";

export default function CinematicFloatingHeader({ config }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isScrolled, scrollDirection } = useHeaderScroll(50);

  const isHidden = isScrolled && scrollDirection === "down" && !isOpen;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
        <motion.header
          initial={{ y: -150, opacity: 0 }}
          animate={{ y: isHidden ? -150 : 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="pointer-events-auto bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 rounded-full px-6 py-3 w-full max-w-5xl flex justify-between items-center"
        >
          {/* Logo */}
          <Link href="/" className="relative z-50 focus-visible:ring-2 ring-primary rounded-full px-2">
             <span className="font-heading text-lg font-bold text-foreground">
               {config.brandName}
             </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {config.navItems.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.url}
                className="font-body text-xs uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors focus-visible:ring-2 ring-primary rounded-full px-3 py-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA / Mobile Toggle */}
          <div className="flex items-center gap-4">
            {config.primaryCta && (
              <Link
                href={config.primaryCta.url}
                className="hidden md:block bg-primary text-primary-foreground px-5 py-2 rounded-full font-body text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
              >
                {config.primaryCta.label}
              </Link>
            )}
            <div className="md:hidden">
              <MenuToggle isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />
            </div>
          </div>
        </motion.header>
      </div>

      <MobileNavOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} config={config} />
    </>
  );
}
```

---

## 9. Header Implementation: Luxury Minimal (`components/layouts/header/LuxuryMinimalHeader.tsx`)
Extremely stripped down. Logo on the left, an elegant "MENU" text/hamburger on the right. Perfect for fine dining & sushi.

```tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeaderProps } from "@/contracts/Layout";
import { MobileNavOverlay } from "./MobileNavOverlay";

export default function LuxuryMinimalHeader({ config }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 w-full py-8 mix-blend-difference text-white">
        <div className="container mx-auto px-8 flex justify-between items-center">
          
          <Link href="/" className="font-heading text-2xl tracking-[0.2em] uppercase focus-visible:ring-1 ring-white">
            {config.brandName}
          </Link>

          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-4 font-body text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity focus-visible:ring-1 ring-white px-2 py-1"
          >
            <span className="hidden md:inline">Menu</span>
            <div className="w-8 flex flex-col gap-1.5">
              <span className="w-full h-[1px] bg-white block" />
              <span className="w-full h-[1px] bg-white block" />
            </div>
          </button>
        </div>
      </header>

      <MobileNavOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} config={config} />
    </>
  );
}
```
