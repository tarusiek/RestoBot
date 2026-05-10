"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-white/10 bg-black/40 backdrop-blur-xl rounded-sm shadow-2xl">
      <h1 className="text-3xl font-heading mb-8">Zaloguj się</h1>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Hasło</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg" 
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground font-bold tracking-[0.2em] uppercase hover:bg-primary/90 transition-all text-xs disabled:opacity-50 mt-4"
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}
