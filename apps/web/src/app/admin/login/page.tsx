"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid administrator credentials.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#faf8f5] overflow-hidden"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* Decorative Glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#FF9933]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#f5c842]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Vedic Symbols */}
      <div className="absolute top-[10%] right-[15%] text-[#FF9933]/20 font-bold text-6xl animate-float pointer-events-none select-none" style={{ animationDelay: '0s' }}>ॐ</div>
      <div className="absolute bottom-[25%] left-[10%] text-[#FF9933]/20 font-bold text-7xl animate-float pointer-events-none select-none" style={{ animationDelay: '1.5s' }}>卐</div>
      <div className="absolute top-[30%] left-[20%] text-[#FF9933]/20 font-bold text-5xl animate-float pointer-events-none select-none" style={{ animationDelay: '0.8s' }}>☀️</div>
      <div className="absolute bottom-[20%] right-[10%] text-[#FF9933]/20 font-bold text-6xl animate-float pointer-events-none select-none" style={{ animationDelay: '2.2s' }}>🌙</div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:scale-105 transition-transform">
            <span className="text-3xl animate-float inline-block drop-shadow-sm">👑</span>
            <span className="font-cinzel text-2xl font-bold tracking-wider" style={{ color: "#FF9933" }}>
              Admin Center
            </span>
          </Link>
        </div>

        <div className="glass-card rounded-[2rem] px-8 py-10 bg-white/80 shadow-2xl border border-white/40">
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-2xl font-bold text-slate-800 tracking-wide">System Access</h1>
            <p className="text-slate-500 font-medium mt-2 text-sm">
              Enter administrator credentials
            </p>
          </div>

          {error && (
            <div
              className="text-sm font-semibold px-5 py-4 rounded-xl shadow-sm mb-6"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3 ml-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full cosmic-input px-5 py-4 rounded-xl text-lg font-bold shadow-sm bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#FF9933]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3 ml-1">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full cosmic-input px-5 py-4 rounded-xl text-lg font-bold shadow-sm bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#FF9933]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded-xl text-lg font-extrabold uppercase tracking-wide shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Authorize ✦"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
