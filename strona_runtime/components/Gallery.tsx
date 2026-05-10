"use client";

import { motion } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-24 bg-muted/20 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-4 md:gap-6">
          <div className="max-w-full">
            <span className="text-primary uppercase tracking-[0.2em] text-xs font-semibold mb-3 md:mb-4 block">Atmosfera</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-white">Wnętrze & Detale</h2>
          </div>
          <a
            href="https://instagram.com/bistrowarszawacafe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm tracking-widest uppercase text-muted-foreground hover:text-white transition-colors border-b border-white/20 pb-1 break-all md:break-normal"
          >
            @bistrowarszawacafe
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative overflow-hidden group ${
                idx === 0 || idx === 3 ? "aspect-square" : "aspect-[3/4]"
              }`}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img
                src={src}
                alt={`Gallery image ${idx + 1}`}
                className="w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
