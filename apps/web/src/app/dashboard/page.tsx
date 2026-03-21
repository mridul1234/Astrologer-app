"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Astrologer {
  id: string;
  speciality: string | null;
  ratePerMin: number;
  isOnline: boolean;
  bio: string | null;
  user: { name: string };
  averageRating: number;
  reviewCount: number;
}

export default function UserDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [loadingAstrologers, setLoadingAstrologers] = useState(true);
  const [balance, setBalance] = useState(0);
  const [starting, setStarting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "online">("all");

  const userName = session?.user?.name ?? "Seeker";

  useEffect(() => {
    fetch("/api/astrologers")
      .then((r) => r.json())
      .then((data) => { setAstrologers(data); setLoadingAstrologers(false); })
      .catch(() => setLoadingAstrologers(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((p) => { if (p?.walletBalance !== undefined) setBalance(p.walletBalance); })
      .catch(() => {});
  }, []);

  const displayedAstrologers = filter === "online"
    ? astrologers.filter((a) => a.isOnline)
    : astrologers;

  async function startChat(astrologerId: string, rate: number) {
    if (balance < rate) {
      router.push("/wallet");
      return;
    }
    
    setStarting(astrologerId);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ astrologerId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 402) router.push("/wallet"); 
        setStarting(null);
        return;
      }

      router.push(`/dashboard/chat/${data.sessionId}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      setStarting(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,200,66,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-sm">✨</span>
          <span className="font-cinzel text-xl font-bold tracking-wider" style={{ color: "#FF9933" }}>
            CosmicChat
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet */}
          <button
            id="wallet-nav-btn"
            onClick={() => router.push("/wallet")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 bg-white shadow-sm border border-[#FF9933]/20"
          >
            <span className="text-sm drop-shadow-sm">💰</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wallet</div>
              <div
                className="font-bold text-[13px] font-cinzel"
                style={{ color: balance < 50 ? "#ef4444" : "#FF9933" }}
              >
                ₹{balance.toFixed(0)}
              </div>
            </div>
          </button>

          {/* Ledger */}
          <button
            onClick={() => router.push("/transactions")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 bg-white shadow-sm border border-[#f5c842]/30"
          >
            <span className="text-sm">📜</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">History</div>
              <div className="font-bold text-[13px] font-cinzel text-slate-700">
                Ledger
              </div>
            </div>
          </button>

          {/* Avatar → Profile */}
          <Link
            href="/profile"
            id="profile-nav-btn"
            className="w-10 h-10 ml-2 rounded-full flex items-center justify-center font-bold text-sm hover:scale-105 transition-transform shadow-md border-2 border-white"
            style={{
              background: "linear-gradient(135deg, #FF9933, #f5c842)",
              color: "white",
            }}
            title="View Profile"
          >
            {userName[0]}
          </Link>

          <button
            onClick={() => router.push("/login")}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-4 font-bold uppercase tracking-wider"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Block */}
        <div className="mb-10 pl-4 border-l-4 border-[#FF9933]">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Namaste, {userName} <span className="opacity-80 text-2xl ml-1">🙏</span>
          </h1>
          <p className="text-slate-500 font-medium">
            The cosmos is ready to guide you. Connect with an astrologer below.
          </p>
        </div>

        {/* Low balance warning */}
        {balance < 100 && (
          <div className="mb-8 px-6 py-4 rounded-2xl flex items-center justify-between gap-4 bg-orange-50 border border-orange-200 shadow-sm animate-pulse-slow">
            <div className="flex items-center gap-4">
              <span className="text-3xl drop-shadow-sm">⚠️</span>
              <div>
                <div className="text-orange-600 font-extrabold text-sm tracking-wide">Low Wallet Balance</div>
                <div className="text-orange-500/80 text-xs font-bold mt-1">Add funds to ensure your consultations aren't cut short.</div>
              </div>
            </div>
            <button
              onClick={() => router.push("/wallet")}
              className="bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white px-6 py-2 rounded-xl text-sm font-bold shrink-0 shadow-md hover:shadow-lg transition-all"
            >
              Add Funds
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white/60 p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex backdrop-blur-md">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mx-3">Filter</span>
          {[
            { key: "all", label: "All Astrologers" },
            { key: "online", label: "🟢 Online Now" },
          ].map((tab) => (
            <button
              key={tab.key}
              id={`filter-${tab.key}`}
              onClick={() => setFilter(tab.key as "all" | "online")}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all tracking-wide"
              style={
                filter === tab.key
                  ? {
                      background: "rgba(255,153,51,0.15)",
                      color: "#e67e22",
                    }
                  : {
                      background: "transparent",
                      color: "#94a3b8",
                    }
              }
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-4 text-slate-400 text-xs font-bold pr-4">
            {astrologers.filter((a) => a.isOnline).length} online · {astrologers.length} total
          </span>
        </div>

        {/* Astrologer Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingAstrologers ? (
            <div className="col-span-3 text-center py-24 text-slate-400 font-bold tracking-widest text-sm uppercase">Loading energy signatures…</div>
          ) : displayedAstrologers.length === 0 ? (
            <div className="col-span-3 text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-5xl mb-4 opacity-50 drop-shadow-sm">🪷</div>
              <p className="text-slate-500 font-bold text-lg mb-1">No astrologers available yet.</p>
              <p className="text-slate-400 text-sm font-medium">Please check back later or modify your filters.</p>
            </div>
          ) : (
            displayedAstrologers.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-6 pos-relative overflow-hidden flex flex-col gap-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,153,51,0.15)] hover:border-[#FF9933]/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Decorative Accent Ring */}
                {a.isOnline && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#34d399]/20 to-transparent rounded-bl-full pointer-events-none opacity-50" />}
                
                {/* Header */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-[#faf8f5] border border-slate-100 drop-shadow-sm"
                  >
                    🧘
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-slate-800 font-extrabold text-[17px] truncate flex items-center gap-2 tracking-tight">
                      {a.user.name}
                      {a.reviewCount > 0 && (
                        <span className="text-[10px] bg-[#fffbed] text-[#d97706] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#fef3c7] font-bold">
                          ★ {a.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-xs mt-1 truncate flex items-center gap-1 font-semibold uppercase tracking-wider">
                      {a.speciality ?? "Vedic Astrology"}
                      {a.reviewCount > 0 && <span className="text-slate-400 text-[9px] ml-1">({a.reviewCount} reviews)</span>}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mt-1 font-medium">{a.bio ?? "Available for spiritual and cosmic guidance."}</p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
                  <div>
                    <span className="font-cinzel font-bold text-slate-800 text-xl">₹{a.ratePerMin}</span>
                    <span className="text-slate-400 text-xs font-bold tracking-widest ml-1">/ MIN</span>
                  </div>
                  <button
                    id={`chat-btn-${a.id}`}
                    onClick={() => startChat(a.id, a.ratePerMin)}
                    disabled={!a.isOnline || !!starting}
                    className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-sm tracking-wide ${
                      a.isOnline
                        ? "bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white hover:shadow-md hover:scale-[1.02]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {starting === a.id ? "Connecting…" : a.isOnline ? "Chat Now" : "Offline"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
