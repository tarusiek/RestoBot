"use client";

import { motion } from "framer-motion";

const reviews = [
  {
    text: "Niesamowite doświadczenie kulinarne. Policzki wołowe rozpływają się w ustach, a wnętrze tworzy niepowtarzalny klimat. Zdecydowanie najlepsze bistro w centrum.",
    author: "Karolina M.",
    source: "Google Reviews"
  },
  {
    text: "Perfekcyjna obsługa i wybitna karta win. Idealne miejsce zarówno na spotkanie biznesowe, jak i romantyczną kolację. Wrócimy na pewno.",
    author: "Piotr W.",
    source: "TripAdvisor"
  },
  {
    text: "Każdy detal dopracowany do perfekcji. Sernik pistacjowy to mistrzostwo świata. Bardzo polecam!",
    author: "Anna K.",
    source: "Google Reviews"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <span className="text-primary uppercase tracking-[0.2em] text-xs font-semibold mb-4 block">Doświadczenia</span>
          <h2 className="text-4xl md:text-5xl font-heading text-white">Głosy naszych Gości</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="text-primary mb-6 text-2xl">"</div>
              <p className="text-muted-foreground font-light text-lg mb-8 leading-relaxed">
                {review.text}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-white font-heading">{review.author}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{review.source}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
