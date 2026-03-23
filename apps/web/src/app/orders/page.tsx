"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";

interface ChatSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  status: string;
  astrologer: {
    speciality: string | null;
    ratePerMin: number;
    user: { name: string | null };
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDurationMins(start: string, end: string | null) {
  if (!end) return "—";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

function getAstrologerInitials(name: string | null) {
  if (!name) return "AS";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    ENDED:    { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    ACTIVE:   { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-100" },
    PENDING:  { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  };
  const s = map[status] ?? { label: status, cls: "bg-stone-50 text-stone-500 border-stone-100" };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const { status } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/orders");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const s: ChatSession[] = data.chatSessions ?? [];
        setSessions(s);
        const spent = (data.transactions ?? [])
          .filter((t: { type: string }) => t.type === "DEBIT")
          .reduce((a: number, t: { amount: number }) => a + t.amount, 0);
        setTotalSpent(spent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
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

          <div className="relative">
            <h1 className="text-2xl font-extrabold text-stone-900 mb-1 tracking-tight">Order History</h1>
            <p className="text-stone-500 text-sm font-medium">Your astrology consultation sessions and spending</p>

            <div className="flex flex-wrap items-center gap-6 mt-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Total Sessions</div>
                <div className="text-xl font-extrabold text-stone-800">{sessions.length}</div>
              </div>
              <div className="w-px h-10 bg-stone-200 hidden sm:block" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Total Spent</div>
                <div className="text-xl font-extrabold text-red-500">₹{totalSpent.toFixed(0)}</div>
              </div>
              <div className="w-px h-10 bg-stone-200 hidden sm:block" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Completed</div>
                <div className="text-xl font-extrabold text-emerald-600">
                  {sessions.filter((s) => s.status === "COMPLETED" || s.status === "ENDED").length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SESSION CARDS ─── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-40 bg-stone-100 rounded-full" />
                    <div className="h-3 w-64 bg-stone-50 rounded-full" />
                    <div className="flex gap-6">
                      <div className="h-3 w-20 bg-stone-100 rounded-full" />
                      <div className="h-3 w-20 bg-stone-100 rounded-full" />
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-stone-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-stone-700 mb-1">No consultations yet</h3>
            <p className="text-stone-400 text-sm mb-5">Your astrology session history will appear here</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm hover:shadow-lg hover:shadow-amber-200/60 transition-all"
            >
              Browse Astrologers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const astroName = s.astrologer.user.name ?? "Astrologer";
              const initials = getAstrologerInitials(astroName);
              const duration = getDurationMins(s.startedAt, s.endedAt);
              const cost = s.totalCost ?? 0;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-[#f5c842]/30 transition-all duration-200 p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#ffb347] flex items-center justify-center text-stone-900 font-extrabold text-sm shrink-0 shadow-sm shadow-amber-200/40">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <span className="text-base font-extrabold text-stone-900 truncate">{astroName}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-xs text-stone-500 font-medium mb-3">
                        {s.astrologer.speciality ?? "Vedic Astrology"} &nbsp;·&nbsp; ₹{s.astrologer.ratePerMin}/min
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {duration}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {formatDate(s.startedAt)} · {formatTime(s.startedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-stone-900">
                        {cost > 0 ? `₹${cost.toFixed(0)}` : "Free"}
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium mt-0.5">charged</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <p className="text-center text-xs text-stone-400 mt-6 font-medium">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} found
          </p>
        )}
      </main>
      <UserFooter />
    </div>
  );
}
