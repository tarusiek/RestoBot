"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image & Ambient Treatment */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop"
          alt="Bistro Warszawa Cafe Interior"
          className="w-full h-full object-cover object-center brightness-[0.6] md:brightness-[0.85]"
        />
        
        {/* Layered overlay system: strong dark vignette on edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.85)_100%)] z-10" />
        
        {/* Bottom anchor directional gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-10" />
      </div>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 md:px-12 flex flex-col justify-center items-center h-full mt-10 md:mt-20">
        
        {/* Localized dark isolation zone directly behind the typography to ensure high contrast */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] max-w-[800px] h-[60vh] md:h-[70vh] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.7)_0%,_transparent_70%)] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex flex-col items-center w-full max-w-[375px] sm:max-w-xl md:max-w-3xl mx-auto"
        >
          {/* Badge */}
          <span className="inline-block px-5 py-2 border border-primary/40 text-primary uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-6 md:mb-8 bg-black/60 backdrop-blur-md shadow-lg">
            Al. Jerozolimskie 47, Warszawa
          </span>
          
          {/* Headline */}
          <h1 className="text-[2.75rem] leading-[1.1] sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold text-white tracking-tight mb-5 md:mb-8 drop-shadow-[0_4px_16px_rgba(0,0,0,1)] text-center">
            Nowoczesna <br className="hidden sm:block" />
            <span className="italic text-white/90 font-medium">Kuchnia</span> Premium
          </h1>
          
          {/* Subheadline */}
          <p className="max-w-[320px] sm:max-w-lg md:max-w-2xl mx-auto text-white/95 text-base sm:text-lg md:text-xl font-body mb-10 md:mb-12 font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] text-center">
            Odkryj harmonię smaków w samym sercu Warszawy. Miejsce, gdzie tradycja spotyka się z wyrafinowaną nowoczesnością.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full px-2 sm:px-0">
            <a
              href="#reservation"
              className="flex-1 sm:flex-none px-8 py-5 bg-primary text-primary-foreground font-bold tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300 shadow-[0_4px_24px_rgba(212,175,55,0.35)] text-xs md:text-sm text-center"
            >
              Zarezerwuj Stolik
            </a>
            <a
              href="#menu"
              className="flex-1 sm:flex-none px-8 py-5 bg-black/50 backdrop-blur-lg border border-white/20 text-white font-bold tracking-[0.15em] uppercase hover:bg-white/10 hover:border-white/40 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.5)] text-xs md:text-sm text-center"
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
        className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">Odkryj</span>
        <div className="w-px h-10 md:h-12 bg-gradient-to-b from-primary/80 to-transparent" />
      </motion.div>
    </section>
  );
}
