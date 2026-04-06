"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import VedicLoader from "@/components/VedicLoader";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const { status, data: session } = useSession();
  const userName = session?.user?.name ?? "U";

  const { data: profile, isLoading } = useSWR("/api/user/profile", fetcher);
  const balance = profile?.walletBalance !== undefined ? Number(profile.walletBalance) : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/wallet");
    }
  }, [status, router]);

  const handleRecharge = (amount: number) => {
    alert(`In Phase 2, this will mount the Razorpay Modal for ₹${amount}.`);
  };

  if (status === "loading" || balance === null) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8f5]">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <VedicLoader size="lg" text="Loading wallet..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 bg-[#faf8f5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <UserHeader />

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-6 mt-10 mb-24">
        {/* Banner Section */}
        <div className="bg-white border border-[#f5c842]/30 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-[0_10px_40px_rgba(245,200,66,0.1)]">
          {/* Decorative Glow */}
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-gradient-to-bl from-[#FF9933]/15 to-transparent rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-4xl font-cinzel font-bold text-slate-800 mb-3 tracking-tight">Add Money to Wallet</h1>
            <p className="text-slate-500 font-medium text-sm mb-6">Choose a quick recharge or pick a larger pack for extra value.</p>
            <div className="flex flex-wrap gap-2 text-[10px] font-extrabold tracking-widest uppercase">
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-full shadow-sm">Secure payments</span>
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-full shadow-sm">Instant wallet credit</span>
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-full shadow-sm">UPI, Cards, Netbanking</span>
            </div>
          </div>

          <div className="bg-[#faf8f5] border border-[#f5c842]/40 rounded-2xl p-6 min-w-[220px] relative z-10 self-stretch md:self-auto flex flex-col justify-center shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Available Balance</div>
            <div className="text-4xl font-cinzel font-bold text-[#10b981] drop-shadow-sm">₹ {balance.toFixed(0)}</div>
          </div>
        </div>

        {/* Grid Title */}
        <div className="mt-14 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-cinzel font-bold text-slate-800">Popular Recharge</h2>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Tap any amount to continue</span>
        </div>

        {/* Recharge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {packs.map((pack) => (
            <button
              key={pack.amount}
              onClick={() => handleRecharge(pack.amount)}
              className="relative bg-white border border-slate-200 hover:border-[#FF9933]/60 hover:shadow-[0_8px_30px_rgba(255,153,51,0.15)] transition-all p-6 rounded-2xl flex flex-col items-start group shadow-sm"
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white text-[9px] font-extrabold px-4 py-[4px] rounded-full shadow-md tracking-widest uppercase">
                  POPULAR
                </div>
              )}
              
              <div className="w-full text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Recharge</div>
              <div className="w-full text-[26px] font-extrabold text-slate-800 mb-5 tracking-tight">₹ {pack.amount}</div>
              
              <div className="w-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-extrabold py-2 rounded-xl text-center mb-6 tracking-wide">
                {pack.bonusPercentage}% Extra
              </div>
              
              <div className="w-full text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-[#FF9933] transition-colors mt-auto text-center">
                Tap to pay →
              </div>
            </button>
          ))}
        </div>
      </main>
      <MobileBottomNav />
      <UserFooter />
    </div>
  );
}
