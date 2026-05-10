"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30 z-10" />
        {/* Unsplash cinematic restaurant image */}
        <img
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop"
          alt="Bistro Warszawa Cafe Interior"
          className="w-full h-full object-cover object-center scale-105 transform-gpu motion-safe:animate-pulse-slow"
        />
      </div>

      <div className="container relative z-20 mx-auto px-6 md:px-12 text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <span className="block text-primary uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-6">
            Al. Jerozolimskie 47, Warszawa
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-medium text-white leading-tight mb-8 drop-shadow-2xl">
            Nowoczesna <br />
            <span className="italic text-white/90">Kuchnia</span> Premium
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-xl font-body mb-12 font-light leading-relaxed">
            Odkryj harmonię smaków w samym sercu Warszawy. Miejsce, gdzie tradycja spotyka się z wyrafinowaną nowoczesnością.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#reservation"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-medium tracking-widest uppercase hover:bg-primary/90 transition-all duration-300"
            >
              Zarezerwuj Stolik
            </a>
            <a
              href="#menu"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-medium tracking-widest uppercase hover:bg-white/5 transition-all duration-300"
            >
              Zobacz Menu
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Odkryj</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </section>
  );
}
