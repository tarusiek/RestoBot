"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const menuData = [
  {
    category: "Przystawki",
    items: [
      { name: "Tatar wołowy", description: "Polędwica, kapary, szalotka, piklowany rydz, emulsja truflowa", price: "52 PLN" },
      { name: "Carpaccio z buraka", description: "Piklowany burak, ser kozi, orzechy włoskie, oliwa szczypiorkowa", price: "38 PLN" },
      { name: "Krewetki tygrysie", description: "Białe wino, masło czosnkowe, natka pietruszki, grzanka", price: "64 PLN" }
    ]
  },
  {
    category: "Dania Główne",
    items: [
      { name: "Policzki wołowe", description: "Wolno gotowane, puree truflowe, palona marchew, demi-glace", price: "89 PLN" },
      { name: "Stek z polędwicy", description: "Polędwica wołowa sezonowana 28 dni, gratin ziemniaczane, szparagi", price: "145 PLN" },
      { name: "Kaczka konfitowana", description: "Modra kapusta z jabłkiem, kopytka, sos wiśniowy z tymiankiem", price: "78 PLN" },
      { name: "Halibut pieczony", description: "Risotto szafranowe, groszek cukrowy, sos beurre blanc", price: "92 PLN" }
    ]
  },
  {
    category: "Desery",
    items: [
      { name: "Sernik pistacjowy", description: "Biała czekolada, kruszonka migdałowa, maliny", price: "34 PLN" },
      { name: "Fondant czekoladowy", description: "Czekolada 70%, lody waniliowe, coulis z owoców leśnych", price: "36 PLN" }
    ]
  }
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section id="menu" className="py-24 md:py-32 bg-background border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <span className="text-primary uppercase tracking-[0.2em] text-xs font-semibold mb-4 block">Nasza Karta</span>
          <h2 className="text-4xl md:text-5xl font-heading text-white">Menu Degustacyjne</h2>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
          {menuData.map((category, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(idx)}
              className={`text-sm md:text-base font-medium tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
                activeCategory === idx 
                  ? "border-primary text-white" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="max-w-4xl mx-auto min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="grid gap-10"
            >
              {menuData[activeCategory].items.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row justify-between items-baseline gap-4 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-heading text-white group-hover:text-primary transition-colors">{item.name}</h3>
                      <div className="hidden md:block flex-1 border-b border-white/10 border-dotted mt-4" />
                    </div>
                    <p className="text-muted-foreground font-light text-sm md:text-base">{item.description}</p>
                  </div>
                  <div className="text-xl font-heading text-white whitespace-nowrap">
                    {item.price}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="mt-20 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-white/20 text-white font-medium tracking-widest uppercase hover:bg-white/5 transition-all duration-300"
          >
            Pobierz pełne menu (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}
