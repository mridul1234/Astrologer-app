"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Astrologer {
  id: string;
  speciality: string;
  ratePerMin: number;
  isOnline: boolean;
  bio: string;
  rating: number;
  totalSessions: number;
  user: { name: string };
  badge: string;
  zodiacIcon: string;
}

// Dummy astrologers data — replace with API call when ready
const DUMMY_ASTROLOGERS: Astrologer[] = [
  {
    id: "a1",
    user: { name: "Pandit Ravi Sharma" },
    speciality: "Vedic Astrology · Kundali",
    ratePerMin: 30,
    isOnline: true,
    bio: "25+ years of experience in Vedic Jyotish. Specialized in marriage, career & spiritual guidance.",
    rating: 4.9,
    totalSessions: 3200,
    badge: "Top Rated",
    zodiacIcon: "☀️",
  },
  {
    id: "a2",
    user: { name: "Dr. Meera Joshi" },
    speciality: "Numerology · Tarot",
    ratePerMin: 20,
    isOnline: true,
    bio: "Tarot & numerology expert with a PhD in parapsychology. Known for eerily accurate love readings.",
    rating: 4.8,
    totalSessions: 1850,
    badge: "Trending",
    zodiacIcon: "🌙",
  },
  {
    id: "a3",
    user: { name: "Acharya Dev Prasad" },
    speciality: "Palmistry · Vastu",
    ratePerMin: 25,
    isOnline: false,
    bio: "Master of Hasta Rekha (palmistry) and Vastu Shastra. Provides holistic life alignment.",
    rating: 4.7,
    totalSessions: 2100,
    badge: "Expert",
    zodiacIcon: "⭐",
  },
  {
    id: "a4",
    user: { name: "Deepika Rao" },
    speciality: "Western Astrology · Natal Chart",
    ratePerMin: 18,
    isOnline: true,
    bio: "Certified Western astrologer specializing in natal charts, transits, and compatibility readings.",
    rating: 4.6,
    totalSessions: 980,
    badge: "Rising Star",
    zodiacIcon: "🌟",
  },
  {
    id: "a5",
    user: { name: "Guru Arjun Nair" },
    speciality: "KP Astrology · Prashna",
    ratePerMin: 35,
    isOnline: true,
    bio: "KP astrology specialist with 30 years of practice. Answers specific questions with surgical precision.",
    rating: 5.0,
    totalSessions: 5400,
    badge: "Grand Master",
    zodiacIcon: "🔮",
  },
  {
    id: "a6",
    user: { name: "Sanya Kapoor" },
    speciality: "Angel Cards · Crystal Healing",
    ratePerMin: 15,
    isOnline: false,
    bio: "Angel card reader and crystal healer combining spiritual tools for deep energy healing sessions.",
    rating: 4.5,
    totalSessions: 620,
    badge: "New",
    zodiacIcon: "💫",
  },
];

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "Top Rated": {
    bg: "rgba(245,200,66,0.15)",
    color: "#f5c842",
    border: "rgba(245,200,66,0.3)",
  },
  "Trending": {
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
  "Grand Master": {
    bg: "rgba(124,58,237,0.2)",
    color: "#c4b5fd",
    border: "rgba(124,58,237,0.4)",
  },
  "Expert": {
    bg: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "rgba(59,130,246,0.3)",
  },
  "Rising Star": {
    bg: "rgba(16,185,129,0.12)",
    color: "#6ee7b7",
    border: "rgba(16,185,129,0.3)",
  },
  "New": {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.15)",
  },
};

export default function UserDashboard() {
  const router = useRouter();
  const [balance, setBalance] = useState(500); // Dummy balance
  const [starting, setStarting] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [filter, setFilter] = useState<"all" | "online">("all");
  const [userName] = useState("Rahul"); // Dummy user name

  const astrologers = filter === "online"
    ? DUMMY_ASTROLOGERS.filter((a) => a.isOnline)
    : DUMMY_ASTROLOGERS;

  async function startChat(astrologerId: string, rate: number) {
    if (balance < rate * 2) {
      setShowWallet(true);
      return;
    }
    setStarting(astrologerId);
    // Simulate starting a session — replace with real API call
    await new Promise((r) => setTimeout(r, 1200));
    setStarting(null);
    // Redirect to a dummy chat page
    router.push(`/dashboard/chat/demo-session-${astrologerId}`);
  }

  return (
    <div className="min-h-screen" style={{ position: "relative", zIndex: 1 }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(5,3,17,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          <span className="font-cinzel text-lg font-bold" style={{ color: "#f5c842" }}>
            CosmicChat
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet */}
          <button
            id="wallet-nav-btn"
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(245,200,66,0.1)",
              border: "1px solid rgba(245,200,66,0.2)",
            }}
          >
            <span className="text-sm">💰</span>
            <div className="text-left">
              <div className="text-xs" style={{ color: "rgba(253,230,138,0.6)" }}>Wallet</div>
              <div
                className="font-bold text-sm font-cinzel"
                style={{ color: balance < 50 ? "#f87171" : "#f5c842" }}
              >
                ₹{balance.toFixed(0)}
              </div>
            </div>
          </button>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #d97706)",
              color: "white",
            }}
          >
            {userName[0]}
          </div>

          <button
            onClick={() => router.push("/login")}
            className="text-sm text-purple-300/60 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-2">
            Namaste, {userName} 🙏
          </h1>
          <p className="text-purple-300/60">
            The cosmos is ready to guide you. Connect with an astrologer below.
          </p>
        </div>

        {/* Low balance warning */}
        {balance < 100 && (
          <div
            className="mb-8 px-5 py-4 rounded-2xl flex items-center justify-between gap-4"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-red-300 font-medium text-sm">Low Wallet Balance</div>
                <div className="text-red-400/60 text-xs">Add funds to continue chatting with astrologers</div>
              </div>
            </div>
            <button
              onClick={() => setShowWallet(true)}
              className="btn-gold px-5 py-2 rounded-xl text-sm font-bold shrink-0"
            >
              Add Funds
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-purple-300/60 text-sm">Show:</span>
          {[
            { key: "all", label: "All Astrologers" },
            { key: "online", label: "🟢 Online Now" },
          ].map((tab) => (
            <button
              key={tab.key}
              id={`filter-${tab.key}`}
              onClick={() => setFilter(tab.key as "all" | "online")}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                filter === tab.key
                  ? {
                      background: "linear-gradient(135deg, rgba(245,200,66,0.15), rgba(124,58,237,0.15))",
                      border: "1px solid rgba(245,200,66,0.3)",
                      color: "#f5c842",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(196,181,253,0.6)",
                    }
              }
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-purple-400/40 text-sm">
            {astrologers.filter((a) => a.isOnline).length} online · {astrologers.length} total
          </span>
        </div>

        {/* Astrologer Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {astrologers.map((a) => {
            const badge = BADGE_STYLES[a.badge] || BADGE_STYLES["New"];
            return (
              <div
                key={a.id}
                className="glass-card rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 group"
                style={{ cursor: "default" }}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.3))",
                      border: "1px solid rgba(245,200,66,0.15)",
                    }}
                  >
                    {a.zodiacIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-white font-semibold truncate">{a.user.name}</div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {a.badge}
                      </span>
                    </div>
                    <div className="text-purple-400/70 text-xs mt-0.5 truncate">{a.speciality}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-yellow-400 text-xs">{"★".repeat(Math.floor(a.rating))} {a.rating}</span>
                      <span className="text-purple-500/40 text-xs">{a.totalSessions.toLocaleString()} sessions</span>
                    </div>
                  </div>
                  {/* Online status */}
                  <div
                    className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${
                      a.isOnline ? "status-online" : "status-offline"
                    }`}
                    style={{
                      background: a.isOnline ? "rgba(52,211,153,0.1)" : "rgba(107,114,128,0.1)",
                      border: `1px solid ${a.isOnline ? "rgba(52,211,153,0.2)" : "rgba(107,114,128,0.2)"}`,
                    }}
                  >
                    {a.isOnline ? "● Online" : "○ Away"}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-purple-300/60 text-xs leading-relaxed line-clamp-2">{a.bio}</p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <div>
                    <span className="font-cinzel font-bold text-white text-lg">₹{a.ratePerMin}</span>
                    <span className="text-purple-400/60 text-xs">/min</span>
                  </div>
                  <button
                    id={`chat-btn-${a.id}`}
                    onClick={() => startChat(a.id, a.ratePerMin)}
                    disabled={!a.isOnline || !!starting}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      a.isOnline
                        ? "btn-gold"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    style={
                      !a.isOnline
                        ? {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.4)",
                          }
                        : {}
                    }
                  >
                    {starting === a.id ? "Connecting…" : a.isOnline ? "Chat Now" : "Offline"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── WALLET MODAL ─── */}
      {showWallet && (
        <WalletModal
          balance={balance}
          onClose={() => setShowWallet(false)}
          onTopup={(amount) => {
            setBalance((b) => b + amount);
            setShowWallet(false);
          }}
        />
      )}
    </div>
  );
}

function WalletModal({
  balance,
  onClose,
  onTopup,
}: {
  balance: number;
  onClose: () => void;
  onTopup: (amount: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const PRESETS = [199, 499, 999, 1999];

  async function handlePay() {
    const amount = selected || Number(custom);
    if (!amount || amount < 10) return;
    setLoading(true);
    // Dummy Razorpay flow — replace with real Razorpay SDK later
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));
    onTopup(amount);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(5,3,17,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl px-8 py-10 animate-slide-up"
        style={{
          background: "rgba(15,10,35,0.95)",
          border: "1px solid rgba(245,200,66,0.15)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(245,200,66,0.05)",
        }}
      >
        {success ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-cinzel text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-purple-300/60 text-sm">Your wallet has been topped up.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-white">Add Funds</h2>
                <p className="text-purple-300/60 text-xs mt-1">Powered by Razorpay (Demo)</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Current balance */}
            <div
              className="px-5 py-4 rounded-2xl mb-6 text-center"
              style={{
                background: "rgba(245,200,66,0.06)",
                border: "1px solid rgba(245,200,66,0.12)",
              }}
            >
              <div className="text-purple-300/60 text-xs mb-1">Current Balance</div>
              <div className="font-cinzel text-3xl font-bold" style={{ color: "#f5c842" }}>
                ₹{balance.toFixed(0)}
              </div>
            </div>

            {/* Amount presets */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-purple-200/70 mb-3">
                Select Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    id={`preset-${p}`}
                    onClick={() => { setSelected(p); setCustom(""); }}
                    className="py-3 rounded-xl font-bold text-sm transition-all"
                    style={
                      selected === p
                        ? {
                            background: "linear-gradient(135deg, #d97706, #f5c842)",
                            color: "#1a0533",
                            boxShadow: "0 4px 20px rgba(245,200,66,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(196,181,253,0.7)",
                          }
                    }
                  >
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-purple-200/70 mb-2">
                Or enter custom amount
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: "#f5c842" }}
                >
                  ₹
                </span>
                <input
                  id="custom-amount-input"
                  type="number"
                  min={10}
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
                  className="cosmic-input w-full pl-8 pr-4 py-3.5 rounded-xl text-base"
                  placeholder="Enter amount (min ₹10)"
                />
              </div>
            </div>

            {/* Pay button */}
            <button
              id="pay-now-btn"
              onClick={handlePay}
              disabled={loading || (!selected && !Number(custom))}
              className="btn-gold w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  Processing Payment…
                </>
              ) : (
                <>
                  💳 Pay with Razorpay ₹{selected || custom || 0}
                </>
              )}
            </button>

            <p className="text-center text-purple-500/40 text-xs mt-4">
              🔒 Secure payment via Razorpay (Demo mode — no real charge)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
