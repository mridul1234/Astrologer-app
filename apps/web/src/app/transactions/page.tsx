"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  reason: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/transactions");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/transactions")
        .then((r) => r.json())
        .then((data) => {
          if (data.transactions) setTransactions(data.transactions);
          // Artificial delay for smooth skeleton animation showcase
          setTimeout(() => setLoading(false), 800);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#100b20] flex items-center justify-center">
        <div className="animate-spin text-5xl opacity-50">🕉️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#100b20] to-[#0a0710]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg shadow-black/50"
        style={{
          background: "rgba(16, 11, 32, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 153, 51, 0.15)", // Saffron subtle border
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,184,77,0.5)]">✨</span>
          <span className="font-cinzel text-lg font-bold tracking-wider" style={{ color: "#FFB84D" }}>
            CosmicChat
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#FFB84D]/60 hover:text-[#FFB84D] hover:drop-shadow-[0_0_8px_rgba(255,184,77,0.5)] transition-all"
          >
            ← Back
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="text-sm font-semibold text-white/50 hover:text-white transition-all"
          >
            Wallet
          </button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-4xl mx-auto px-6 mt-12 mb-24 relative">
        {/* Decorative Background Glows */}
        <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-[#FF9933]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-10%] w-96 h-96 bg-[#6366f1]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Block */}
        <div className="relative z-10 mb-10 border-l-4 border-[#FF9933] pl-5 py-1">
          <h1 className="text-4xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB84D] to-[#FF9933] mb-2 tracking-wide drop-shadow-sm">
            Karmic Ledger
          </h1>
          <p className="text-white/50 text-sm font-medium">Trace the flow of your cosmic energy & transactions.</p>
        </div>

        {/* Transaction Feed */}
        <div className="bg-[#1A1235]/60 backdrop-blur-md rounded-3xl border border-[#FF9933]/10 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative z-10">
          
          {loading ? (
            // Premium Skeletons
            <div className="p-4 sm:p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#241A4A]/40 animate-pulse border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/10 rounded-full"></div>
                      <div className="h-3 w-20 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-white/5 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            // Empty State
            <div className="py-24 text-center flex flex-col items-center">
              <span className="text-6xl mb-6 opacity-40 drop-shadow-[0_0_15px_rgba(255,184,77,0.3)]">🪷</span>
              <h3 className="text-xl font-cinzel font-bold text-[#FFB84D] mb-2">No Energies Exchanged</h3>
              <p className="text-white/40 text-sm mb-6 max-w-[250px]">Your ledger is completely empty. Top up your wallet to begin consulting.</p>
              <button
                onClick={() => router.push("/wallet")}
                className="bg-gradient-to-r from-[#FF9933] to-[#e68a2e] text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,153,51,0.3)]"
              >
                Recharge Wallet
              </button>
            </div>
          ) : (
            // Data Rows
            <div className="divide-y divide-[#FF9933]/10">
              {transactions.map((tx) => (
                <div
                  key={tx.id || Math.random()}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-[#241A4A]/40 transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner ${
                      tx.type === "CREDIT" 
                        ? "bg-[#34d399]/10 border-[#34d399]/30 text-[#34d399]" 
                        : "bg-[#f87171]/10 border-[#f87171]/30 text-[#f87171]"
                    }`}>
                      {tx.type === "CREDIT" ? (
                        <span className="text-xl group-hover:-translate-y-1 transition-transform">↓</span>
                      ) : (
                        <span className="text-xl group-hover:-translate-y-1 transition-transform">↑</span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white/90 text-[15px] mb-1 group-hover:text-[#FFB84D] transition-colors">
                        {tx.type === "CREDIT" && tx.reason?.includes("Earnings") ? "Consultation Revenue" : 
                         tx.type === "CREDIT" ? "Wallet Top-Up" : "Astrology Consultation"}
                      </h4>
                      <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                        {tx.reason?.replace("Chat Earnings", "ID").replace("Chat", "ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between ml-16 sm:ml-0">
                    <div className={`font-cinzel font-bold text-lg sm:text-xl tracking-wide ${
                      tx.type === "CREDIT" ? "text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-white"
                    }`}>
                      {tx.type === "CREDIT" ? "+" : "-"} ₹ {tx.amount.toFixed(0)}
                    </div>
                    <div className="text-xs text-white/30 font-medium">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
