"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Pack {
  amount: number;
  bonusPercentage: number;
  popular?: boolean;
}

const packs: Pack[] = [
  { amount: 10, bonusPercentage: 100 },
  { amount: 50, bonusPercentage: 50, popular: true },
  { amount: 100, bonusPercentage: 50 },
  { amount: 200, bonusPercentage: 50 },
  { amount: 500, bonusPercentage: 50 },
  { amount: 1000, bonusPercentage: 5 },
  { amount: 2000, bonusPercentage: 6 },
  { amount: 3000, bonusPercentage: 10 },
  { amount: 4000, bonusPercentage: 12 },
  { amount: 8000, bonusPercentage: 12 },
  { amount: 15000, bonusPercentage: 15 },
  { amount: 20000, bonusPercentage: 15 },
  { amount: 50000, bonusPercentage: 20 },
  { amount: 100000, bonusPercentage: 20 },
];

export default function WalletPage() {
  const router = useRouter();
  const { status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/wallet");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.walletBalance !== undefined) setBalance(p.walletBalance);
      })
      .catch(() => {});
  }, []);

  const handleRecharge = (amount: number) => {
    alert(`In Phase 2, this will mount the Razorpay Modal for ₹${amount}.`);
  };

  if (status === "loading" || balance === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05030a" }}>
        <div className="animate-spin text-4xl">🔮</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#05030a]" style={{ fontFamily: "'Inter', sans-serif" }}>
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

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 border border-white/20 flex items-center justify-center font-bold text-xs">
            U
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-6 mt-8 mb-24">
        {/* Banner Section */}
        <div className="bg-[#110e20] border border-[#f5c842]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-[0_0_40px_rgba(245,200,66,0.05)]">
          {/* Decorative Glow */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#f5c842]/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-cinzel font-bold text-[#f5c842] mb-2">Add Money to Wallet</h1>
            <p className="text-white/60 text-sm mb-5">Choose a quick recharge or pick a larger pack for extra value.</p>
            <div className="flex flex-wrap gap-2 text-[11px] font-medium tracking-wide">
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">Secure payments</span>
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">Instant wallet credit</span>
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">UPI, Cards, Netbanking</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[200px] relative z-10 backdrop-blur-md self-stretch md:self-auto flex flex-col justify-center">
            <div className="text-xs text-white/50 uppercase tracking-widest mb-1 font-semibold">Available Balance</div>
            <div className="text-3xl font-cinzel font-bold text-[#34d399]">₹ {balance.toFixed(0)}</div>
          </div>
        </div>

        {/* Grid Title */}
        <div className="mt-14 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-4">
          <h2 className="text-xl font-cinzel font-bold text-white">Popular Recharge</h2>
          <span className="text-xs text-white/40 font-medium">Tap any amount to continue</span>
        </div>

        {/* Recharge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {packs.map((pack) => (
            <button
              key={pack.amount}
              onClick={() => handleRecharge(pack.amount)}
              className="relative bg-[#0d0b17] border border-white/5 hover:border-[#f5c842]/60 hover:bg-[#151226] transition-all p-5 rounded-2xl flex flex-col items-start group shadow-lg shadow-black/40"
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#f5c842] to-[#ffb01f] text-black text-[10px] font-bold px-3 py-[3px] rounded-full shadow-[0_0_15px_rgba(245,200,66,0.4)] tracking-wider">
                  POPULAR
                </div>
              )}
              
              <div className="w-full text-[10px] text-white/40 uppercase tracking-widest mb-1 font-bold">Recharge</div>
              <div className="w-full text-2xl font-bold text-white mb-4 tracking-tight">₹ {pack.amount}</div>
              
              <div className="w-full bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] text-xs font-bold py-1.5 rounded-lg text-center mb-5 tracking-wide">
                {pack.bonusPercentage}% Extra
              </div>
              
              <div className="w-full text-[11px] text-white/30 group-hover:text-[#f5c842] transition-colors mt-auto font-medium">
                Tap to pay →
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
