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
  const { status, data: session } = useSession();
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
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="animate-spin text-5xl opacity-30">🪷</div>
      </div>
    );
  }

  const isAstrologer = session?.user?.role === "ASTROLOGER";

  return (
    <div className="min-h-screen text-slate-800 bg-[#faf8f5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,200,66,0.15)", // Saffron subtle border
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-sm">✨</span>
          <span className="font-cinzel text-xl font-bold tracking-wider" style={{ color: "#FF9933" }}>
            CosmicChat
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-[#FF9933] transition-colors"
          >
            ← Back
          </button>
          {!isAstrologer && (
            <button
              onClick={() => router.push("/wallet")}
              className="text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-slate-800 transition-colors"
            >
              Wallet
            </button>
          )}
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-4xl mx-auto px-6 mt-12 mb-24 relative">
        {/* Decorative Background Glows */}
        <div className="absolute top-[5%] left-[-10%] w-96 h-96 bg-[#FF9933]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Block */}
        <div className="relative z-10 mb-10 border-l-4 border-[#FF9933] pl-5 py-1">
          <h1 className="text-4xl font-cinzel font-bold text-slate-800 mb-2 tracking-wide drop-shadow-sm">
            Karmic Ledger
          </h1>
          <p className="text-slate-500 text-sm font-medium">Trace the flow of your cosmic energy & transactions.</p>
        </div>

        {/* Transaction Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative z-10">
          
          {loading ? (
            // Premium Skeletons
            <div className="p-4 sm:p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 animate-pulse border border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-40 bg-slate-200 rounded-full"></div>
                      <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-6 w-28 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            // Empty State
            <div className="py-24 text-center flex flex-col items-center">
              <span className="text-6xl mb-6 opacity-30 drop-shadow-sm">🪷</span>
              <h3 className="text-2xl font-cinzel font-bold text-slate-800 mb-2">No Energies Exchanged</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-[250px] font-medium">Your ledger is completely empty. Exchange energy to begin.</p>
              {!isAstrologer && (
                <button
                  onClick={() => router.push("/wallet")}
                  className="bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-extrabold px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-md"
                >
                  Recharge Wallet
                </button>
              )}
            </div>
          ) : (
            // Data Rows
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div
                  key={tx.id || Math.random()}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-slate-50 transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-5 mb-3 sm:mb-0">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${
                      tx.type === "CREDIT" 
                        ? "bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]" 
                        : "bg-red-50 border border-red-100 text-red-500"
                    }`}>
                      {tx.type === "CREDIT" ? (
                        <span className="text-2xl group-hover:-translate-y-1 transition-transform">↓</span>
                      ) : (
                        <span className="text-2xl group-hover:-translate-y-1 transition-transform">↑</span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[16px] mb-1 group-hover:text-[#FF9933] transition-colors">
                        {tx.type === "CREDIT" && tx.reason?.includes("Earnings") ? "Consultation Revenue" : 
                         tx.type === "CREDIT" ? "Wallet Top-Up" : "Astrology Consultation"}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {tx.reason?.replace("Chat Earnings", "ID").replace("Chat", "ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between ml-16 sm:ml-0">
                    <div className={`font-cinzel font-bold text-xl sm:text-2xl tracking-wide ${
                      tx.type === "CREDIT" ? "text-[#10b981]" : "text-slate-800"
                    }`}>
                      {tx.type === "CREDIT" ? "+" : "-"} ₹ {tx.amount.toFixed(0)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
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
