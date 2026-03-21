"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [bio, setBio] = useState("");
  const [ratePerMin, setRatePerMin] = useState("15");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/"); // Boot non-admins
    }
  }, [status, session, router]);

  if (status === "loading" || session?.user?.role !== "ADMIN") {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Admin Panel...</div>;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/admin/astrologers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, speciality, bio, ratePerMin }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMsg({ text: `Successfully registered ${name}! They can now log in.`, type: "success" });
      setName("");
      setEmail("");
      setPassword("");
      setSpeciality("");
      setBio("");
      setRatePerMin("15");
    } else {
      setMsg({ text: data.error || "Failed to register astrologer", type: "error" });
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-['Inter']">
      <header className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👑</span>
          <div>
            <h1 className="text-2xl font-cinzel font-bold tracking-wider">Admin Command Center</h1>
            <p className="text-white/50 text-sm">System configuration and Astrologer onboarding</p>
          </div>
        </div>
        <Link href="/" className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm">
          Return to App
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 font-cinzel">Register New Astrologer</h2>
          
          {msg && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Full Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40" />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Email Address (Login ID)</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40" placeholder="astro@cosmic.chat" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Temporary Password</label>
              <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Per-Minute Rate (₹)</label>
              <input required type="number" min="1" value={ratePerMin} onChange={e => setRatePerMin(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Speciality (e.g. Vedic, Tarot)</label>
              <input required value={speciality} onChange={e => setSpeciality(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Public Biography</label>
              <textarea required value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-white/40 resize-none" />
            </div>

            <div className="col-span-2 mt-4">
              <button disabled={loading} type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                {loading ? "Registering..." : "Provision Astrologer Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
