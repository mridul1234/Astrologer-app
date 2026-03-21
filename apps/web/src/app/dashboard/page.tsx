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
  const [showWallet, setShowWallet] = useState(false);
  const [filter, setFilter] = useState<"all" | "online">("all");

  const userName = session?.user?.name ?? "Seeker";

  useEffect(() => {
    // 1. Fetch astrologers
    fetch("/api/astrologers")
      .then((r) => r.json())
      .then((data) => { setAstrologers(data); setLoadingAstrologers(false); })
      .catch(() => setLoadingAstrologers(false));

    // 2. Fetch proper user balance
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
      setShowWallet(true);
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
        if (res.status === 402) setShowWallet(true); // Insufficient balance
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
            onClick={() => router.push("/wallet")}
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

          {/* Ledger */}
          <button
            onClick={() => router.push("/transactions")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,153,51,0.1)",
              border: "1px solid rgba(255,153,51,0.2)",
            }}
          >
            <span className="text-sm">📜</span>
            <div className="text-left">
              <div className="text-xs font-semibold" style={{ color: "rgba(255,153,51,0.6)" }}>History</div>
              <div className="font-bold text-sm font-cinzel text-white drop-shadow-md">
                Ledger
              </div>
            </div>
          </button>

          {/* Avatar → Profile */}
          <Link
            href="/profile"
            id="profile-nav-btn"
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm hover:scale-110 transition-transform"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #d97706)",
              color: "white",
            }}
            title="View Profile"
          >
            {userName[0]}
          </Link>

          <Link
            href="/profile"
            id="profile-link"
            className="text-sm text-purple-300/60 hover:text-white transition-colors"
          >
            Profile
          </Link>

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
          {loadingAstrologers ? (
            <div className="col-span-3 text-center py-16 text-purple-400/50">Loading astrologers…</div>
          ) : displayedAstrologers.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <div className="text-4xl mb-3">🔮</div>
              <p className="text-purple-300/50">No astrologers available yet.</p>
              <p className="text-purple-400/30 text-sm mt-1">Sign up an astrologer account to get started!</p>
            </div>
          ) : (
            displayedAstrologers.map((a) => (
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
                    🔮
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate flex items-center gap-2">
                      {a.user.name}
                      {a.reviewCount > 0 && (
                        <span className="text-xs bg-[#f5c842]/10 text-[#f5c842] px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-[#f5c842]/20">
                          <span className="text-[10px]">★</span> {a.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-purple-400/70 text-xs mt-0.5 truncate flex items-center gap-1">
                      {a.speciality ?? "Astrology"}
                      {a.reviewCount > 0 && <span className="text-purple-400/40 text-[10px]">({a.reviewCount} reviews)</span>}
                    </div>
                  </div>
                  {/* Online status */}
                  <div
                    className="text-xs px-2 py-1 rounded-lg font-medium shrink-0"
                    style={{
                      background: a.isOnline ? "rgba(52,211,153,0.1)" : "rgba(107,114,128,0.1)",
                      border: `1px solid ${a.isOnline ? "rgba(52,211,153,0.2)" : "rgba(107,114,128,0.2)"}`,
                      color: a.isOnline ? "#6ee7b7" : "#6b7280",
                    }}
                  >
                    {a.isOnline ? "● Online" : "○ Away"}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-purple-300/60 text-xs leading-relaxed line-clamp-2">{a.bio ?? "Available for cosmic guidance."}</p>

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
            ))
          )}
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
