"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import VedicLoader from "@/components/VedicLoader";

interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  reason: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Thin vertical divider line SVG icon
function CreditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/transactions");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user/transactions")
      .then((r) => r.json())
      .then((data) => {
        const credits = (data.transactions ?? []).filter((t: Transaction) => t.type === "CREDIT");
        setTransactions(credits);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => { if (d?.walletBalance !== undefined) setBalance(d.walletBalance); })
      .catch(() => {});
  }, [status]);

  const totalAdded = transactions.reduce((a, t) => a + t.amount, 0);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfaf5]">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <VedicLoader size="lg" text="Loading transactions..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800">

      <UserHeader />

      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* ─── HERO ─── */}
        <div className="bg-gradient-to-br from-[#fef9ec] to-[#fef3c7] rounded-3xl border border-[#f0e6c8] p-7 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#f5c842]/10 pointer-events-none" />
          <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-[#ffb347]/08 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 mb-1 tracking-tight">Wallet Transactions</h1>
              <p className="text-stone-500 text-sm font-medium">All money you have added to your wallet</p>

              <div className="flex items-center gap-6 mt-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Total Loaded</div>
                  <div className="text-xl font-extrabold text-emerald-600">+₹{totalAdded.toFixed(0)}</div>
                </div>
                <div className="w-px h-10 bg-stone-200" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Transactions</div>
                  <div className="text-xl font-extrabold text-stone-800">{transactions.length}</div>
                </div>
                <div className="w-px h-10 bg-stone-200" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Current Balance</div>
                  <div className="text-xl font-extrabold text-stone-800">
                    ₹{balance !== null ? balance.toFixed(0) : "—"}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/wallet")}
              className="self-start sm:self-center px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm hover:shadow-lg hover:shadow-amber-200/60 hover:scale-[1.02] active:scale-100 transition-all duration-200 whitespace-nowrap"
            >
              Add Money
            </button>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr] px-6 py-3 bg-stone-50 border-b border-stone-100 text-[11px] font-bold uppercase tracking-widest text-stone-400">
            <span>Date &amp; Time</span>
            <span className="text-center">Reference</span>
            <span className="text-right">Amount Added</span>
          </div>

          {loading ? (
            <div className="divide-y divide-stone-50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr] px-6 py-4 animate-pulse gap-4">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-stone-100 shrink-0" /><div className="space-y-2"><div className="h-3.5 w-24 bg-stone-100 rounded-full" /><div className="h-3 w-16 bg-stone-50 rounded-full" /></div></div>
                  <div className="flex justify-center items-center"><div className="h-3.5 w-20 bg-stone-100 rounded-full" /></div>
                  <div className="flex justify-end items-center"><div className="h-4 w-16 bg-stone-100 rounded-full" /></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-700 mb-1">No deposits yet</h3>
              <p className="text-stone-400 text-sm mb-5">Add money to your wallet to get started</p>
              <button
                onClick={() => router.push("/wallet")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm hover:shadow-lg hover:shadow-amber-200/60 transition-all"
              >
                Add Money
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-[2fr_1fr_1fr] items-center px-6 py-4 hover:bg-amber-50/30 transition-colors group"
                >
                  {/* Date + time */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CreditIcon />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-800">{formatDate(tx.createdAt)}</div>
                      <div className="text-[11px] text-stone-400 font-medium mt-0.5">{formatTime(tx.createdAt)}</div>
                    </div>
                  </div>

                  {/* Ref ID */}
                  <div className="flex justify-center">
                    <span className="text-[11px] font-mono font-semibold text-stone-500 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-lg">
                      {`TXN-${tx.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600">+₹{tx.amount.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <div className="px-6 py-3 border-t border-stone-50 bg-stone-50/50 flex justify-between items-center">
              <span className="text-xs text-stone-400 font-medium">{transactions.length} records</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Total: +₹{totalAdded.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      </main>
      <UserFooter />
    </div>
  );
}
