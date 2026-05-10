"use client";

import { motion } from "framer-motion";

export default function ReservationCTA() {
  return (
    <section id="reservation" className="py-24 md:py-32 bg-accent relative border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-primary uppercase tracking-[0.2em] text-xs font-semibold mb-4 block">Rezerwacje</span>
              <h2 className="text-4xl md:text-5xl font-heading text-white mb-6">Zarezerwuj Stolik</h2>
              <p className="text-muted-foreground font-light mb-8">
                Zapraszamy do kontaktu w celu rezerwacji stolika. W przypadku rezerwacji grupowych (powyżej 6 osób) prosimy o kontakt telefoniczny.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white">
                  <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-primary text-xs">T</span>
                  <span className="font-body tracking-wider">22 854 17 48</span>
                </div>
                <div className="flex items-center gap-4 text-white">
                  <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-primary text-xs">M</span>
                  <span className="font-body tracking-wider">Al. Jerozolimskie 47, Warszawa</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-background p-8 border border-white/5"
            >
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Data</label>
                    <input type="date" className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Godzina</label>
                    <select className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none">
                      <option className="bg-background">18:00</option>
                      <option className="bg-background">18:30</option>
                      <option className="bg-background">19:00</option>
                      <option className="bg-background">19:30</option>
                      <option className="bg-background">20:00</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Liczba osób</label>
                  <select className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option className="bg-background">2 osoby</option>
                    <option className="bg-background">3 osoby</option>
                    <option className="bg-background">4 osoby</option>
                    <option className="bg-background">5 osób</option>
                    <option className="bg-background">6 osób</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Imię i nazwisko</label>
                  <input type="text" placeholder="Jan Kowalski" className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-white/20" />
                </div>
                <button className="w-full px-8 py-4 bg-primary text-primary-foreground font-medium tracking-widest uppercase hover:bg-primary/90 transition-all duration-300 mt-4">
                  Potwierdź Rezerwację
                </button>
              </form>
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
