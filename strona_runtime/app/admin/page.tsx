"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { motion } from "framer-motion";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  special_requests: string;
  created_at: string;
};

type Config = {
  restaurant_id: string;
  total_tables: number;
  reservation_duration_minutes: number;
  max_guests_per_reservation: number;
  opening_time: string;
  closing_time: string;
};

type BlockedSlot = {
  id: string;
  block_date: string | null;
  start_time: string;
  end_time: string;
  reason: string;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<'reservations' | 'settings'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [occupancyDate, setOccupancyDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Settings form states (using strings to avoid NaN on empty input)
  const [tables, setTables] = useState<string>("10");
  const [duration, setDuration] = useState<string>("60");
  const [opening, setOpening] = useState("12:00:00");
  const [closing, setClosing] = useState("22:00:00");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);

  // Blocked slots form states
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockStart, setBlockStart] = useState("00:00");
  const [blockEnd, setBlockEnd] = useState("23:59");
  const [blockStatus, setBlockStatus] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }

  async function fetchData() {
    setLoading(true);
    // Fetch reservations
    const { data: resData } = await supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });
    if (resData) setReservations(resData);

    // Fetch config
    const { data: confData } = await supabase
      .from("restaurant_config")
      .select("*")
      .eq("restaurant_id", "bistro-warszawa")
      .single();
    if (confData) {
      setConfig(confData);
      setTables(confData.total_tables?.toString() || "10");
      setDuration(confData.reservation_duration_minutes?.toString() || "60");
      setOpening(confData.opening_time);
      setClosing(confData.closing_time);
    }

    // Fetch blocked slots
    const { data: blocksData } = await supabase
      .from("blocked_slots")
      .select("*")
      .eq("restaurant_id", "bistro-warszawa")
      .order("created_at", { ascending: false });
    if (blocksData) setBlockedSlots(blocksData);

    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("reservations").update({ status }).eq("id", id);
    fetchData();
  }

  async function updateConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus(null);
    
    const parsedTables = parseInt(tables);
    const parsedDuration = parseInt(duration);
    
    if (isNaN(parsedTables) || isNaN(parsedDuration)) {
      setSettingsStatus("Błąd: Nieprawidłowa wartość liczbowa.");
      setSavingSettings(false);
      return;
    }

    const { error } = await supabase.from("restaurant_config").update({
      total_tables: parsedTables,
      reservation_duration_minutes: parsedDuration,
      opening_time: opening,
      closing_time: closing
    }).eq("restaurant_id", "bistro-warszawa");
    
    if (error) {
      setSettingsStatus(`Błąd Supabase: ${error.message}`);
      setSavingSettings(false);
      return;
    }
    
    await fetchData();
    setSavingSettings(false);
    setSettingsStatus("Zapisano pomyślnie.");
    setTimeout(() => setSettingsStatus(null), 3000);
  }

  async function addBlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingBlock(true);
    setBlockStatus(null);
    
    if (!blockReason.trim()) {
      setBlockStatus("Błąd: Podaj powód blokady.");
      setSavingBlock(false);
      return;
    }

    const { error } = await supabase.from("blocked_slots").insert([{
      restaurant_id: "bistro-warszawa",
      block_date: blockDate || null,
      start_time: blockStart + ":00",
      end_time: blockEnd + ":00",
      reason: blockReason.trim()
    }]);

    if (error) {
      setBlockStatus(`Błąd Supabase: ${error.message}`);
      setSavingBlock(false);
      return;
    }
    
    setBlockDate("");
    setBlockReason("");
    setBlockStart("00:00");
    setBlockEnd("23:59");
    
    await fetchData();
    setSavingBlock(false);
    setBlockStatus("Blokada dodana pomyślnie.");
    setTimeout(() => setBlockStatus(null), 3000);
  }

  async function removeBlock(id: string) {
    await supabase.from("blocked_slots").delete().eq("id", id);
    fetchData();
  }

  if (loading) return <div className="text-center py-20 text-white/50 animate-pulse">Ładowanie systemu...</div>;

  const pending = reservations.filter(r => r.status === 'pending');
  const upcoming = reservations.filter(r => r.status === 'confirmed');

  // Calculate live occupancy for selected date
  const occupancyReservations = upcoming.filter(r => r.reservation_date === occupancyDate);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-heading mb-2">Panel Zarządzania</h1>
          <p className="text-white/50 font-light">System rezerwacji i pojemności restauracji</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('reservations')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${tab === 'reservations' ? 'bg-primary text-primary-foreground' : 'border border-white/20 text-white hover:bg-white/5'}`}>Rezerwacje</button>
          <button onClick={() => setTab('settings')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${tab === 'settings' ? 'bg-primary text-primary-foreground' : 'border border-white/20 text-white hover:bg-white/5'}`}>Dostępność & Ustawienia</button>
        </div>
      </div>

      {tab === 'reservations' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pending Reservations */}
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Nowe Prośby ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="border border-white/10 border-dashed p-8 text-center text-white/40">Brak nowych próśb.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map(res => (
                  <div key={res.id} className="bg-white/5 border border-white/10 p-6 rounded-sm shadow-xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-heading text-xl">{res.customer_name}</div>
                        <div className="text-white/50 text-sm">{res.customer_phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-bold text-lg">{res.guests} osób</div>
                      </div>
                    </div>
                    <div className="bg-black/50 p-4 border border-white/5 mb-6">
                      <div className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Termin</div>
                      <div className="text-lg">{format(parseISO(res.reservation_date), "dd MMM yyyy", { locale: pl })} o {res.reservation_time.slice(0, 5)}</div>
                    </div>
                    {res.special_requests && (
                      <div className="mb-6 text-sm text-white/70 italic border-l-2 border-primary/50 pl-3">"{res.special_requests}"</div>
                    )}
                    <div className="mt-auto flex gap-3">
                      <button onClick={() => updateStatus(res.id, 'confirmed')} className="flex-1 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs hover:bg-primary/90 transition-colors">Akceptuj</button>
                      <button onClick={() => updateStatus(res.id, 'rejected')} className="flex-1 py-3 bg-red-900/30 text-red-400 border border-red-900/50 font-bold uppercase tracking-wider text-xs hover:bg-red-900/50 transition-colors">Odrzuć</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Live Occupancy Widget */}
          <section className="bg-primary/10 border border-primary/20 p-6 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Obłożenie Sal</h2>
              <input 
                type="date" 
                value={occupancyDate} 
                onChange={e => setOccupancyDate(e.target.value)}
                className="bg-black/50 border border-primary/30 p-2 text-primary text-xs focus:outline-none focus:border-primary [color-scheme:dark] rounded-sm"
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {/* Accurate timeline visualization calculating max overlap per hour */}
              {Array.from({ length: 12 }).map((_, i) => {
                const hour = 12 + i;
                
                // Calculate the max active tables at any point within this hour bucket
                let maxActiveThisHour = 0;
                for (let min = 0; min < 60; min += 15) {
                  const checkTime = hour * 60 + min;
                  const activeAtMin = occupancyReservations.filter(r => {
                    const [resHour, resMin] = r.reservation_time.split(':').map(Number);
                    const resStart = resHour * 60 + resMin;
                    const resEnd = resStart + (config?.reservation_duration_minutes || 60);
                    return checkTime >= resStart && checkTime < resEnd;
                  }).length;
                  if (activeAtMin > maxActiveThisHour) maxActiveThisHour = activeAtMin;
                }
                
                const capacityRatio = Math.min(100, (maxActiveThisHour / (config?.total_tables || 10)) * 100);
                const isFull = maxActiveThisHour >= (config?.total_tables || 10);
                
                // Dynamic colors based on capacity
                let colorClass = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
                if (capacityRatio >= 80) {
                  colorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
                } else if (capacityRatio >= 40) {
                  colorClass = 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
                }
                if (maxActiveThisHour === 0) {
                  colorClass = 'bg-transparent';
                }
                
                return (
                  <div key={hour} className="min-w-[80px] bg-black/40 border border-white/10 p-3 flex flex-col items-center">
                    <div className="text-white/50 text-xs mb-2">{hour}:00</div>
                    <div className="w-2 h-16 bg-white/10 rounded-full overflow-hidden relative">
                      <motion.div 
                        className={`absolute bottom-0 left-0 right-0 w-full rounded-full ${colorClass}`}
                        initial={{ height: "0%" }}
                        animate={{ height: `${capacityRatio}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                      />
                    </div>
                    <div className={`font-bold mt-2 text-xs ${isFull ? 'text-red-400' : 'text-white'}`}>{maxActiveThisHour}/{config?.total_tables || 10}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Confirmed Reservations */}
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 mb-6">Zatwierdzone Rezerwacje ({upcoming.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
                    <th className="p-4 font-normal">Data & Czas</th>
                    <th className="p-4 font-normal">Gość</th>
                    <th className="p-4 font-normal">Osoby</th>
                    <th className="p-4 font-normal">Kontakt</th>
                    <th className="p-4 font-normal text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(res => (
                    <tr key={res.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 whitespace-nowrap"><span className="font-bold text-white">{format(parseISO(res.reservation_date), "dd.MM.yyyy")}</span><span className="text-primary ml-2">{res.reservation_time.slice(0,5)}</span></td>
                      <td className="p-4 font-heading text-base">{res.customer_name}</td>
                      <td className="p-4">{res.guests}</td>
                      <td className="p-4 text-white/60">{res.customer_phone}</td>
                      <td className="p-4 text-right"><button onClick={() => updateStatus(res.id, 'cancelled')} className="text-[10px] uppercase tracking-widest text-red-400/50 hover:text-red-400 transition-colors">Anuluj</button></td>
                    </tr>
                  ))}
                  {upcoming.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-white/30 italic">Brak rezerwacji.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Capacity Settings */}
          <section className="space-y-6">
            <h2 className="text-xl font-heading border-b border-white/10 pb-4">Pojemność & Godziny</h2>
            <form onSubmit={updateConfig} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-sm">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Liczba Stolików</label>
                  <input type="number" min="1" value={tables} onChange={e => setTables(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary focus:outline-none" />
                  <p className="text-xs text-white/30">Maksymalna liczba rezerwacji w jednym slocie.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Czas Rezerwacji (min)</label>
                  <input type="number" step="15" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary focus:outline-none" />
                  <p className="text-xs text-white/30">Jak długo stolik jest zablokowany.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Otwarcie</label>
                  <input type="time" value={opening} onChange={e => setOpening(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Zamknięcie</label>
                  <input type="time" value={closing} onChange={e => setClosing(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={savingSettings} className="flex-1 py-4 bg-white/10 text-white font-bold tracking-[0.2em] uppercase hover:bg-white/20 transition-all text-xs disabled:opacity-50">
                  {savingSettings ? "Zapisywanie..." : "Zapisz Ustawienia"}
                </button>
                {settingsStatus && (
                  <span className={`text-xs font-bold ${settingsStatus.includes('Błąd') ? 'text-red-400' : 'text-primary'}`}>
                    {settingsStatus}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Blocked Dates Management */}
          <section className="space-y-6">
            <h2 className="text-xl font-heading border-b border-white/10 pb-4">Wyłączenia & Blokady</h2>
            
            <form onSubmit={addBlock} className="space-y-6 bg-red-900/10 border border-red-900/30 p-6 rounded-sm">
              <p className="text-xs text-white/50 mb-4">Dodaj ręczną blokadę terminów (np. awaria, święto, event zamknięty).</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Data (opcjonalnie)</label>
                  <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="w-full bg-black border border-red-900/50 p-3 text-white focus:border-red-400 focus:outline-none text-sm [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Powód</label>
                  <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="np. Wigilia firmowa" className="w-full bg-black border border-red-900/50 p-3 text-white focus:border-red-400 focus:outline-none text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Od Godziny</label>
                  <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full bg-black border border-red-900/50 p-3 text-white focus:border-red-400 focus:outline-none text-sm [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Do Godziny</label>
                  <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full bg-black border border-red-900/50 p-3 text-white focus:border-red-400 focus:outline-none text-sm [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={savingBlock} className="flex-1 py-4 bg-red-900/30 text-red-400 font-bold tracking-[0.2em] uppercase hover:bg-red-900/50 border border-red-900/50 transition-all text-xs disabled:opacity-50">
                  {savingBlock ? "Dodawanie..." : "Dodaj Blokadę"}
                </button>
                {blockStatus && (
                  <span className={`text-xs font-bold ${blockStatus.includes('Błąd') ? 'text-red-400' : 'text-primary'}`}>
                    {blockStatus}
                  </span>
                )}
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mt-8">Aktywne Blokady</h3>
              {blockedSlots.length === 0 ? (
                <div className="text-white/30 italic text-sm">Brak aktywnych blokad.</div>
              ) : (
                blockedSlots.map(block => (
                  <div key={block.id} className="bg-black border border-white/10 p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-red-400">{block.reason}</div>
                      <div className="text-white/50 text-xs mt-1">
                        {block.block_date ? format(parseISO(block.block_date), "dd MMM yyyy") : "Codziennie"} • {block.start_time.slice(0,5)} - {block.end_time.slice(0,5)}
                      </div>
                    </div>
                    <button onClick={() => removeBlock(block.id)} className="text-white/30 hover:text-red-400 p-2">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
