"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32 bg-background relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl md:text-5xl font-heading text-white mb-8 leading-tight">
              Kulinarna podróż w <br />
              <span className="text-primary italic">Sercu Stolicy</span>
            </h2>
            
            <div className="space-y-6 text-muted-foreground font-light text-lg leading-relaxed">
              <p>
                Bistro Warszawa Cafe powstało z miłości do rzemieślniczej kuchni i szczerej gościnności. Znajdując się przy tętniących życiem Alejach Jerozolimskich, stworzyliśmy azyl dla poszukiwaczy najwyższej jakości smaków.
              </p>
              <p>
                Nasz szef kuchni codziennie selekcjonuje najświeższe lokalne składniki, by łączyć klasyczne polskie akcenty z nowoczesnymi technikami kulinarnymi z całego świata. Każde danie to osobna opowieść, podana w bezkompromisowej formie.
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
              <div>
                <span className="block text-3xl font-heading text-white mb-2">2018</span>
                <span className="text-sm tracking-wider uppercase text-muted-foreground">Rok założenia</span>
              </div>
              <div>
                <span className="block text-3xl font-heading text-white mb-2">Premium</span>
                <span className="text-sm tracking-wider uppercase text-muted-foreground">Jakość składników</span>
              </div>
            </div>
          </motion.div>

          {/* Image composition */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2 relative h-[500px] md:h-[600px] w-full"
          >
            <div className="absolute inset-0 bg-muted/20" />
            <img 
              src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop" 
              alt="Chef plating a dish" 
              className="w-full h-full object-cover object-center grayscale-[20%] hover:grayscale-0 transition-all duration-700"
            />
            
            {/* Decorative element */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 md:w-48 md:h-48 border border-primary/50 -z-10" />
            <div className="absolute -top-6 -right-6 w-32 h-32 md:w-48 md:h-48 border border-white/10 -z-10" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
