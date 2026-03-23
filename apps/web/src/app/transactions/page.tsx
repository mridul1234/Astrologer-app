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

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDescription(tx: Transaction) {
  if (tx.type === "CREDIT") return "Wallet Recharge";
  if (tx.reason?.toLowerCase().includes("chat")) return "Astrology Consultation";
  return tx.reason || "Deduction";
}

function getInvoiceId(tx: Transaction) {
  return `INV-${tx.id.slice(0, 8).toUpperCase()}`;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/transactions");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/transactions")
        .then((r) => r.json())
        .then((data) => {
          if (data.transactions) setTransactions(data.transactions);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((d) => { if (d?.walletBalance !== undefined) setBalance(d.walletBalance); })
        .catch(() => {});
    }
  }, [status]);

  const filtered = transactions.filter((t) =>
    filter === "ALL" ? true : t.type === filter
  );

  const totalCredit = transactions.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === "DEBIT").reduce((a, t) => a + t.amount, 0);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800">

      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_12px_rgba(245,200,66,0.08)]">
        <div className="max-w-5xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-amber-800 text-lg">☽</span>
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-stone-900 group-hover:text-[#d97706] transition-colors">CosmicInsight</div>
              <div className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold">Divine Astro Insight</div>
            </div>
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5c842] text-stone-900 font-bold hover:shadow-md transition-all text-xs">
              🏠 Home
            </Link>
            <span className="text-stone-300">›</span>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-[#f5c842]/40 text-[#d97706] font-bold text-xs">
              Wallet Transactions
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ─── HERO CARD ─── */}
        <div className="bg-gradient-to-r from-[#fef9ec] to-[#fef3c7] rounded-3xl border border-[#f0e6c8] p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#f5c842]/10 pointer-events-none" />
          <div className="absolute top-8 -right-4 w-24 h-24 rounded-full bg-[#ffb347]/10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 mb-1">My Wallet</h1>
              <p className="text-stone-500 text-sm">Track your wallet credits and payment history in one place.</p>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 mt-4">
                {(["ALL", "CREDIT", "DEBIT"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      filter === f
                        ? "bg-[#f5c842] text-stone-900 shadow-md shadow-amber-200/50"
                        : "bg-white border border-stone-200 text-stone-500 hover:border-[#f5c842]/60 hover:text-[#d97706]"
                    }`}
                  >
                    {f === "ALL" ? "All Transactions" : f === "CREDIT" ? "Money In" : "Money Out"}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Available Balance</div>
                <div className="text-3xl font-extrabold text-stone-900">
                  ₹{balance !== null ? balance.toFixed(0) : "—"}
                </div>
              </div>
              <button
                onClick={() => router.push("/wallet")}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#f5c842]/60 text-stone-800 font-extrabold text-sm hover:bg-[#f5c842] hover:shadow-md hover:shadow-amber-200/50 transition-all duration-200"
              >
                Recharge
              </button>
            </div>
          </div>
        </div>

        {/* ─── SUMMARY PILLS ─── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Transactions", value: transactions.length, icon: "📊", color: "text-stone-700" },
            { label: "Total Added", value: `₹${totalCredit.toFixed(0)}`, icon: "📥", color: "text-emerald-600" },
            { label: "Total Spent", value: `₹${totalDebit.toFixed(0)}`, icon: "📤", color: "text-red-500" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</div>
                <div className={`text-xl font-extrabold ${color}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── TRANSACTION TABLE ─── */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-base font-extrabold text-stone-800">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="divide-y divide-stone-50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-stone-100 rounded-full w-40" />
                    <div className="h-3 bg-stone-50 rounded-full w-24" />
                  </div>
                  <div className="h-3.5 bg-stone-100 rounded-full w-20" />
                  <div className="h-3.5 bg-stone-100 rounded-full w-20" />
                  <div className="h-3.5 bg-stone-100 rounded-full w-28" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-stone-700 mb-1">No Transactions Found</h3>
              <p className="text-stone-400 text-sm">
                {filter !== "ALL" ? "No transactions match this filter." : "Your transaction history will appear here."}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 bg-stone-50 border-b border-stone-100 text-[11px] font-bold uppercase tracking-widest text-stone-400">
                <span>Description</span>
                <span>Invoice</span>
                <span>Transaction Amount</span>
                <span>Date & Time</span>
              </div>

              <div className="divide-y divide-stone-50">
                {filtered.map((tx) => (
                  <div
                    key={tx.id}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1.5fr] gap-2 sm:gap-4 items-center px-6 py-4 hover:bg-amber-50/30 transition-colors group"
                  >
                    {/* Description */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 font-bold ${
                        tx.type === "CREDIT"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-red-50 text-red-500 border border-red-100"
                      }`}>
                        {tx.type === "CREDIT" ? "↓" : "↑"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-800 group-hover:text-[#d97706] transition-colors">
                          {getDescription(tx)}
                        </div>
                        <div className="text-[11px] text-stone-400 font-medium">
                          {tx.type === "CREDIT" ? "Money Added" : "Charged"}
                        </div>
                      </div>
                    </div>

                    {/* Invoice ID */}
                    <div className="sm:block">
                      <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                        {getInvoiceId(tx)}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className={`text-sm font-extrabold ${tx.type === "CREDIT" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "CREDIT" ? "+" : "−"} ₹{tx.amount.toFixed(0)}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-stone-400 font-medium">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-stone-400 mt-6 font-medium">
            Showing {filtered.length} of {transactions.length} transactions
          </p>
        )}
      </main>
    </div>
  );
}
