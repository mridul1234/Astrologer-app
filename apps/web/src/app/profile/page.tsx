"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

type Tab = "overview" | "sessions" | "transactions" | "settings";

interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  reason: string | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  status: string;
  astrologer: {
    speciality: string | null;
    ratePerMin: number;
    user: { name: string };
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  createdAt: string;
  transactions: Transaction[];
  chatSessions: ChatSession[];
}

// Derive a clean label for any transaction
function txLabel(tx: Transaction, sessions: ChatSession[]): { title: string; sub: string } {
  if (tx.type === "CREDIT") {
    return { title: "Wallet Recharge", sub: "Money added to wallet" };
  }
  // For DEBIT: try to match by approximate timestamp with a session that ended nearby
  const txTime = new Date(tx.createdAt).getTime();
  let matched: ChatSession | undefined;
  let minDiff = Infinity;
  for (const s of sessions) {
    const endTime = s.endedAt ? new Date(s.endedAt).getTime() : new Date(s.startedAt).getTime();
    const diff = Math.abs(txTime - endTime);
    if (diff < minDiff) { minDiff = diff; matched = s; }
  }
  // If within 2 minutes of a session end, match it
  if (matched && minDiff < 2 * 60 * 1000) {
    return {
      title: `Chat with ${matched.astrologer.user.name}`,
      sub: `₹${matched.astrologer.ratePerMin}/min · ${matched.astrologer.speciality ?? "Vedic"}`,
    };
  }
  // Fallback: clean up reason text
  const r = tx.reason ?? "";
  if (r.toLowerCase().includes("chat")) return { title: "Chat Session", sub: "Astrology consultation" };
  return { title: r || "Chat Deduction", sub: "Astrology consultation" };
}

export default function UserProfilePage() {
  useRouter();
  const { data: sessionData } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) { setProfile(data); setEditName(data.name); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    if (!editName.trim() || !profile) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const updated = await res.json();
      if (updated?.name) {
        setProfile((p) => p ? { ...p, name: updated.name } : p);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) { console.error(e); }
    setSavingProfile(false);
  }

  const totalCredits = profile?.transactions.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0) ?? 0;
  const totalDebits = profile?.transactions.filter((t) => t.type === "DEBIT").reduce((a, t) => a + t.amount, 0) ?? 0;
  const memberSince = profile ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";
  const initials = profile?.name?.slice(0, 2).toUpperCase() ?? "??";
  // Phone: the user logs in with phone, which may be stored as email-like. Show it cleanly.
  const phone = sessionData?.user?.email ?? profile?.email ?? "";
  const displayPhone = phone.includes("@") ? phone.split("@")[0] : phone;

  const tabStyle = (t: Tab) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      activeTab === t
        ? "bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 shadow-sm shadow-amber-200/40"
        : "bg-white border border-stone-200 text-stone-500 hover:border-[#f5c842]/60 hover:text-[#d97706] hover:bg-amber-50"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-400 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-stone-800 font-sans">
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
          <Link href="/dashboard" className="text-sm font-semibold text-stone-500 hover:text-[#d97706] transition-colors flex items-center gap-1">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ─── PROFILE HERO ─── */}
        <div className="bg-gradient-to-r from-[#fef9ec] to-[#fef3c7] rounded-3xl border border-[#f0e6c8] p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#f5c842]/10 pointer-events-none" />
          <div className="absolute top-8 -right-4 w-24 h-24 rounded-full bg-[#ffb347]/10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#ffb347] flex items-center justify-center text-2xl font-extrabold text-stone-900 shadow-lg shadow-amber-200/50 shrink-0 border-2 border-white/60">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-stone-900 mb-1">{profile?.name ?? "User"}</h1>
              <p className="text-stone-400 text-sm mb-4 flex items-center gap-1.5">
                <span>📱</span>
                <span>{displayPhone}</span>
                <span className="text-stone-300">·</span>
                <span>Member since {memberSince}</span>
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: "💬", label: "Sessions", value: profile?.chatSessions.length ?? 0, color: "text-stone-900" },
                  { icon: "💰", label: "Balance", value: `₹${(profile?.walletBalance ?? 0).toFixed(0)}`, color: "text-green-600" },
                  { icon: "📥", label: "Total Added", value: `₹${totalCredits.toFixed(0)}`, color: "text-stone-900" },
                  { icon: "📤", label: "Total Spent", value: `₹${totalDebits.toFixed(0)}`, color: "text-stone-900" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 bg-white/70 border border-[#f0e6c8] rounded-2xl px-4 py-2.5 hover:shadow-sm hover:border-[#f5c842]/40 transition-all duration-200">
                    <span className="text-base">{s.icon}</span>
                    <div>
                      <div className={`font-extrabold text-sm leading-none ${s.color}`}>{s.value}</div>
                      <div className="text-stone-400 text-[10px] mt-0.5">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/wallet" className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#f0e6c8] text-sm font-semibold text-stone-700 hover:border-[#f5c842] hover:text-[#d97706] hover:shadow-md transition-all duration-200">
              💳 Add Money
            </Link>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "overview", label: "🏠 Overview" },
            { key: "sessions", label: "💬 Sessions" },
            { key: "transactions", label: "💳 Transactions" },
            { key: "settings", label: "⚙️ Settings" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={tabStyle(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card title="Recent Sessions" icon="💬">
              {(profile?.chatSessions.length ?? 0) === 0 ? (
                <EmptyState icon="🌙" message="No sessions yet" sub="Chat with an astrologer to build your history" action={{ label: "Find Astrologers", href: "/dashboard" }} />
              ) : (
                <div className="space-y-2.5">
                  {profile!.chatSessions.slice(0, 3).map((s) => <SessionRow key={s.id} session={s} />)}
                  {profile!.chatSessions.length > 3 && (
                    <button onClick={() => setActiveTab("sessions")} className="text-sm font-semibold text-[#d97706] hover:underline mt-1">
                      View all {profile!.chatSessions.length} sessions →
                    </button>
                  )}
                </div>
              )}
            </Card>

            <Card title="Recent Transactions" icon="💳">
              {(profile?.transactions.length ?? 0) === 0 ? (
                <EmptyState icon="💸" message="No transactions yet" sub="Add money to your wallet to get started" action={{ label: "Add Money", href: "/wallet" }} />
              ) : (
                <div className="space-y-2">
                  {profile!.transactions.slice(0, 5).map((t) => (
                    <TransactionRow key={t.id} tx={t} sessions={profile!.chatSessions} />
                  ))}
                  {profile!.transactions.length > 5 && (
                    <button onClick={() => setActiveTab("transactions")} className="text-sm font-semibold text-[#d97706] hover:underline mt-1">
                      View all transactions →
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── SESSIONS ─── */}
        {activeTab === "sessions" && (
          <Card title={`All Sessions (${profile?.chatSessions.length ?? 0})`} icon="💬">
            {(profile?.chatSessions.length ?? 0) === 0 ? (
              <EmptyState icon="🌙" message="No sessions yet" sub="Chat with an astrologer to see history" action={{ label: "Find Astrologers", href: "/dashboard" }} />
            ) : (
              <div className="space-y-2.5">
                {profile!.chatSessions.map((s) => <SessionRow key={s.id} session={s} />)}
              </div>
            )}
          </Card>
        )}

        {/* ─── TRANSACTIONS ─── */}
        {activeTab === "transactions" && (
          <Card title={`Transaction History (${profile?.transactions.length ?? 0})`} icon="💳">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="px-5 py-4 rounded-2xl bg-green-50 border border-green-200 hover:shadow-sm transition-shadow">
                <div className="text-xs text-stone-400 mb-1 font-medium">Total Added</div>
                <div className="font-extrabold text-xl text-green-600">↑ ₹{totalCredits.toFixed(0)}</div>
              </div>
              <div className="px-5 py-4 rounded-2xl bg-red-50 border border-red-200 hover:shadow-sm transition-shadow">
                <div className="text-xs text-stone-400 mb-1 font-medium">Total Spent</div>
                <div className="font-extrabold text-xl text-red-500">↓ ₹{totalDebits.toFixed(0)}</div>
              </div>
            </div>
            {(profile?.transactions.length ?? 0) === 0 ? (
              <EmptyState icon="💸" message="No transactions yet" sub="Your wallet transactions will appear here" action={{ label: "Add Money", href: "/wallet" }} />
            ) : (
              <div className="space-y-2">
                {profile!.transactions.map((t) => (
                  <TransactionRow key={t.id} tx={t} sessions={profile!.chatSessions} />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card title="Edit Profile" icon="✏️">
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 text-sm font-medium text-stone-800 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile Number <span className="text-stone-400 font-normal">(cannot be changed)</span></label>
                  <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-400 text-sm flex items-center gap-2">
                    🔒 {displayPhone}
                  </div>
                </div>
                {saveSuccess && (
                  <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
                    ✅ Name updated successfully!
                  </div>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || editName.trim() === profile?.name}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm hover:shadow-lg hover:shadow-amber-200/60 hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : "Save Changes ✦"}
                </button>
              </div>
            </Card>

            <Card title="Account" icon="🛡️">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 max-w-md hover:shadow-sm transition-shadow">
                <div>
                  <div className="text-red-700 font-semibold text-sm">Sign Out</div>
                  <div className="text-red-400 text-xs mt-0.5">You will be redirected to login</div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 border border-red-300 text-red-600 hover:bg-red-200 hover:scale-105 active:scale-100 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-[#f0e6c8] shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <h2 className="text-lg font-extrabold text-stone-900 mb-5 flex items-center gap-2">
        <span className="text-[#f5c842]">✦</span> {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function SessionRow({ session }: { session: ChatSession }) {
  const date = new Date(session.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const durationMs = session.endedAt
    ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
    : null;
  const duration = durationMs != null ? `${Math.max(1, Math.round(durationMs / 60000))} min` : "Ongoing";

  return (
    <div className="group flex items-center justify-between px-4 py-4 rounded-2xl border border-stone-100 hover:border-[#f5c842]/40 hover:bg-[#fdfaf5] hover:shadow-sm transition-all duration-200 cursor-default">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform duration-200">
          🔮
        </div>
        <div>
          <div className="text-stone-900 font-bold text-sm">{session.astrologer.user.name}</div>
          <div className="text-stone-400 text-xs mt-0.5">{session.astrologer.speciality ?? "Vedic"} · {date} · {duration}</div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className="font-extrabold text-sm text-[#d97706]">₹{session.totalCost.toFixed(0)}</div>
        <div className={`text-xs font-medium mt-0.5 ${session.status === "ACTIVE" ? "text-green-500" : "text-stone-400"}`}>
          {session.status === "ACTIVE" ? "● Live" : "Completed"}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx, sessions }: { tx: Transaction; sessions: ChatSession[] }) {
  const isCredit = tx.type === "CREDIT";
  const date = new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const { title, sub } = txLabel(tx, sessions);

  return (
    <div className="group flex items-center justify-between px-4 py-3.5 rounded-2xl border border-stone-100 hover:border-[#f5c842]/30 hover:bg-[#fdfaf5] hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 group-hover:scale-105 transition-transform duration-200 ${
          isCredit ? "bg-green-50 text-green-600 border border-green-200" : "bg-orange-50 text-orange-500 border border-orange-200"
        }`}>
          {isCredit ? "↑" : "↓"}
        </div>
        <div>
          <div className="text-stone-800 text-sm font-semibold leading-tight">{title}</div>
          <div className="text-stone-400 text-xs mt-0.5">{sub} · {date}, {time}</div>
        </div>
      </div>
      <div className={`font-extrabold text-sm shrink-0 ml-3 ${isCredit ? "text-green-600" : "text-red-500"}`}>
        {isCredit ? "+" : "−"}₹{tx.amount.toFixed(0)}
      </div>
    </div>
  );
}

function EmptyState({ icon, message, sub, action }: { icon: string; message: string; sub: string; action?: { label: string; href: string } }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-stone-800 font-bold mb-1">{message}</div>
      <div className="text-stone-400 text-sm mb-4">{sub}</div>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-bold text-sm hover:shadow-md hover:scale-105 transition-all duration-200">
          {action.label} →
        </Link>
      )}
    </div>
  );
}
