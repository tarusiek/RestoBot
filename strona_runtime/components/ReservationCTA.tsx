"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { getAvailableSlots, createReservation } from "../lib/reservations";

// Custom Premium Calendar Component
function CustomCalendar({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Calculate empty days to offset the first row (Monday = 1, Sunday = 0)
  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDaysCount = startDay === 0 ? 6 : startDay - 1;
  const emptyDays = Array.from({ length: emptyDaysCount });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const today = startOfDay(new Date());

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-sm w-full max-w-[320px] shadow-2xl absolute z-50 top-[110%] left-0">
      <div className="flex justify-between items-center mb-6">
        <button type="button" onClick={prevMonth} className="text-white/50 hover:text-primary transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-white font-heading tracking-widest uppercase text-sm">{format(currentMonth, "LLLL yyyy", { locale: pl })}</span>
        <button type="button" onClick={nextMonth} className="text-white/50 hover:text-primary transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-4 text-center">
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
          <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {daysInMonth.map((date, i) => {
          const isPast = isBefore(date, today);
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(date)}
              className={`h-8 w-8 flex items-center justify-center text-sm transition-all duration-300 rounded-sm
                ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(212,175,55,0.4)]" : 
                  isPast ? "text-white/20 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReservationCTA() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>(addDays(new Date(), 1));
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", requests: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch slots when date or guests change
  useEffect(() => {
    async function fetchSlots() {
      setIsLoadingSlots(true);
      setTime("");
      try {
        const slots = await getAvailableSlots('bistro-warszawa', date, guests);
        setAvailableSlots(slots);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [date, guests]);

  const handleNext = () => {
    if (!time) {
      setError("Proszę wybrać godzinę.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Imię i numer telefonu są wymagane.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createReservation({
        restaurant_id: 'bistro-warszawa',
        date,
        time,
        guests,
        ...formData
      });
      setStep(3); // Success state
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas rezerwacji.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reservation" className="py-24 md:py-32 bg-background relative border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2 pt-8"
            >
              <span className="text-primary uppercase tracking-[0.2em] text-xs font-bold mb-6 block drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">Rezerwacje</span>
              <h2 className="text-4xl md:text-5xl font-heading text-white mb-8 tracking-tight drop-shadow-md">Zarezerwuj <br/><span className="italic text-white/90">Stolik</span></h2>
              <p className="text-white/60 font-light mb-10 leading-relaxed text-sm md:text-base">
                Doświadcz unikalnej podróży kulinarnej. Nasz system natychmiastowo potwierdza dostępność stolików. W przypadku rezerwacji grupowych prosimy o kontakt telefoniczny.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-white/80">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Telefon</div>
                    <div className="font-body tracking-wider text-sm">22 854 17 48</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-6 sm:p-10 shadow-2xl relative">
                
                {/* Step indicator */}
                {step < 3 && (
                  <div className="flex items-center mb-10">
                    <div className={`text-xs font-bold tracking-widest uppercase ${step === 1 ? 'text-primary' : 'text-white/40'}`}>1. Termin</div>
                    <div className="flex-1 h-px bg-white/10 mx-4" />
                    <div className={`text-xs font-bold tracking-widest uppercase ${step === 2 ? 'text-primary' : 'text-white/40'}`}>2. Dane</div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                        {/* Guests Picker */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Liczba osób</label>
                          <div className="flex items-center border-b border-white/20 pb-2">
                            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="p-2 text-white/50 hover:text-white transition-colors">-</button>
                            <div className="flex-1 text-center text-white font-heading text-xl">{guests}</div>
                            <button onClick={() => setGuests(Math.min(12, guests + 1))} className="p-2 text-white/50 hover:text-white transition-colors">+</button>
                          </div>
                        </div>

                        {/* Date Picker Toggle */}
                        <div className="space-y-4 relative">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Data</label>
                          <button 
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full text-left border-b border-white/20 pb-2 flex justify-between items-center text-white hover:border-primary transition-colors group"
                          >
                            <span className="font-heading text-xl">{format(date, "dd MMM yyyy", { locale: pl })}</span>
                            <svg className="w-5 h-5 text-white/30 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                          {showCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                              <CustomCalendar selectedDate={date} onSelect={(d) => { setDate(d); setShowCalendar(false); }} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Dostępne godziny</label>
                          {isLoadingSlots && <span className="text-[10px] uppercase text-primary animate-pulse">Ładowanie...</span>}
                        </div>
                        
                        {!isLoadingSlots && availableSlots.length === 0 ? (
                          <div className="p-6 text-center border border-red-900/50 bg-red-900/10 text-red-400 font-medium text-sm rounded-sm">
                            Restauracja jest pełna w wybranym terminie.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setTime(slot)}
                                className={`py-3 text-sm font-heading tracking-wider transition-all duration-300 border ${
                                  time === slot 
                                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.3)]" 
                                    : "border-white/10 text-white/70 hover:border-primary/50 hover:text-white"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {error && <div className="mt-6 text-red-400 text-sm">{error}</div>}

                      <button 
                        onClick={handleNext}
                        disabled={!time}
                        className="w-full mt-10 px-8 py-5 bg-white text-black font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        Dalej
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Imię i nazwisko</label>
                          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg font-heading" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Telefon</label>
                            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg font-heading" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Email (opcjonalnie)</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg font-heading" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Specjalne życzenia</label>
                          <input type="text" value={formData.requests} onChange={e => setFormData({...formData, requests: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg font-heading" />
                        </div>

                        {error && <div className="text-red-400 text-sm">{error}</div>}

                        <div className="flex gap-4 mt-10">
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-5 border border-white/20 text-white font-bold tracking-[0.2em] uppercase hover:bg-white/5 transition-all text-xs">
                            Wstecz
                          </button>
                          <button disabled={isSubmitting} type="submit" className="flex-1 px-8 py-5 bg-primary text-primary-foreground font-bold tracking-[0.2em] uppercase hover:bg-primary/90 transition-all duration-300 shadow-[0_4px_24px_rgba(212,175,55,0.3)] disabled:opacity-50 text-xs text-center flex justify-center">
                            {isSubmitting ? "Wysyłanie..." : "Potwierdź rezerwację"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-8 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h3 className="text-3xl font-heading text-white mb-4">Rezerwacja Potwierdzona</h3>
                      <p className="text-white/60 mb-8 max-w-sm">
                        Czekamy na Państwa {format(date, "dd MMMM", { locale: pl })} o godzinie {time}. Potwierdzenie zostało wysłane.
                      </p>
                      <button onClick={() => { setStep(1); setTime(""); }} className="text-xs uppercase tracking-[0.2em] font-bold text-primary hover:text-white transition-colors border-b border-primary/30 pb-1 hover:border-white/50">
                        Zrób kolejną rezerwację
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
