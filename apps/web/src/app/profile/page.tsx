"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Dummy data (replace with real API call) ──────────────────────────────────
const DUMMY_USER = {
  name: "Rahul Mehra",
  phone: "+91 98765 43210",
  walletBalance: 500,
  memberSince: "January 2026",
  totalSessions: 7,
  totalSpent: 1450,
};

const DUMMY_SESSIONS = [
  { id: "s1", astrologer: "Pandit Ravi Sharma", speciality: "Vedic Astrology", date: "20 Mar 2026", duration: "12 min", cost: 360, status: "ENDED" },
  { id: "s2", astrologer: "Dr. Meera Joshi", speciality: "Tarot", date: "18 Mar 2026", duration: "8 min", cost: 160, status: "ENDED" },
  { id: "s3", astrologer: "Guru Arjun Nair", speciality: "KP Astrology", date: "15 Mar 2026", duration: "25 min", cost: 875, status: "ENDED" },
  { id: "s4", astrologer: "Deepika Rao", speciality: "Natal Chart", date: "10 Mar 2026", duration: "3 min", cost: 55, status: "ENDED" },
];

const DUMMY_TRANSACTIONS = [
  { id: "t1", type: "DEBIT", amount: 360, reason: "Chat — Pandit Ravi Sharma", date: "20 Mar 2026" },
  { id: "t2", type: "CREDIT", amount: 999, reason: "Wallet top-up via Razorpay", date: "19 Mar 2026" },
  { id: "t3", type: "DEBIT", amount: 160, reason: "Chat — Dr. Meera Joshi", date: "18 Mar 2026" },
  { id: "t4", type: "DEBIT", amount: 875, reason: "Chat — Guru Arjun Nair", date: "15 Mar 2026" },
  { id: "t5", type: "CREDIT", amount: 499, reason: "Wallet top-up via Razorpay", date: "14 Mar 2026" },
  { id: "t6", type: "DEBIT", amount: 55, reason: "Chat — Deepika Rao", date: "10 Mar 2026" },
];

const ZODIAC_AVATARS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const ZODIAC_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

type Tab = "overview" | "sessions" | "transactions" | "settings";

export default function UserProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [user, setUser] = useState(DUMMY_USER);

  // Settings state
  const [editName, setEditName] = useState(user.name);
  const [selectedZodiac, setSelectedZodiac] = useState(7); // Scorpio
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showZodiacPicker, setShowZodiacPicker] = useState(false);

  async function handleSaveProfile() {
    if (!editName.trim()) return;
    setSavingProfile(true);
    // Dummy save — replace with: await fetch("/api/user/profile", { method: "PATCH", body: JSON.stringify({ name: editName }) })
    await new Promise((r) => setTimeout(r, 900));
    setUser((u) => ({ ...u, name: editName }));
    setSavingProfile(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  const tabStyle = (t: Tab) =>
    activeTab === t
      ? {
          background: "linear-gradient(135deg, rgba(245,200,66,0.12), rgba(124,58,237,0.12))",
          border: "1px solid rgba(245,200,66,0.25)",
          color: "#f5c842",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(196,181,253,0.6)",
        };

  return (
    <div className="min-h-screen" style={{ position: "relative", zIndex: 1 }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(5,3,17,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-400/60 hover:text-white transition-colors mr-1"
          >
            ←
          </button>
          <span className="text-xl">🔮</span>
          <span className="font-cinzel text-lg font-bold" style={{ color: "#f5c842" }}>
            CosmicChat
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-purple-300/60 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* ─── PROFILE HERO ─── */}
        <div
          className="rounded-3xl p-8 mb-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,200,66,0.06))",
            border: "1px solid rgba(245,200,66,0.1)",
          }}
        >
          {/* Decorative ring */}
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ border: "1px solid #f5c842" }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <button
                id="zodiac-avatar-btn"
                onClick={() => setShowZodiacPicker(!showZodiacPicker)}
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all hover:scale-105 group"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.25))",
                  border: "2px solid rgba(245,200,66,0.25)",
                  cursor: "pointer",
                }}
              >
                {ZODIAC_AVATARS[selectedZodiac]}
                <div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  Edit
                </div>
              </button>

              {/* Zodiac picker dropdown */}
              {showZodiacPicker && (
                <div
                  className="absolute top-24 left-0 z-20 p-4 rounded-2xl grid grid-cols-6 gap-2 w-64"
                  style={{
                    background: "rgba(10,6,30,0.98)",
                    border: "1px solid rgba(245,200,66,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                  }}
                >
                  <div className="col-span-6 text-xs text-purple-400/60 mb-1 font-medium">Choose your sign</div>
                  {ZODIAC_AVATARS.map((z, i) => (
                    <button
                      key={i}
                      id={`zodiac-${ZODIAC_NAMES[i].toLowerCase()}`}
                      onClick={() => { setSelectedZodiac(i); setShowZodiacPicker(false); }}
                      title={ZODIAC_NAMES[i]}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:scale-110 transition-all"
                      style={
                        selectedZodiac === i
                          ? { background: "rgba(245,200,66,0.2)", border: "1px solid rgba(245,200,66,0.4)" }
                          : { background: "rgba(255,255,255,0.05)" }
                      }
                    >
                      {z}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-cinzel text-2xl font-bold text-white">{user.name}</h1>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#c4b5fd",
                  }}
                >
                  {ZODIAC_NAMES[selectedZodiac]} ✦ Seeker
                </span>
              </div>
              <p className="text-purple-300/50 text-sm mb-4">
                {user.phone} · Member since {user.memberSince}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: "💬", label: "Sessions", value: user.totalSessions },
                  { icon: "💰", label: "Wallet", value: `₹${user.walletBalance}` },
                  { icon: "🌟", label: "Total Spent", value: `₹${user.totalSpent}` },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg">{s.icon}</div>
                    <div className="font-cinzel font-bold text-white text-sm">{s.value}</div>
                    <div className="text-purple-400/50 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: "overview", label: "🏠 Overview" },
            { key: "sessions", label: "💬 Sessions" },
            { key: "transactions", label: "💳 Transactions" },
            { key: "settings", label: "⚙️ Settings" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={tabStyle(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-slide-up">
            {/* Recent sessions */}
            <Section title="Recent Sessions" icon="💬">
              <div className="space-y-3">
                {DUMMY_SESSIONS.slice(0, 3).map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </div>
              <button
                onClick={() => setActiveTab("sessions")}
                className="mt-4 text-sm font-medium transition-colors hover:text-white"
                style={{ color: "#f5c842" }}
              >
                View all sessions →
              </button>
            </Section>

            {/* Recent transactions */}
            <Section title="Recent Transactions" icon="💳">
              <div className="space-y-2">
                {DUMMY_TRANSACTIONS.slice(0, 4).map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </div>
              <button
                onClick={() => setActiveTab("transactions")}
                className="mt-4 text-sm font-medium transition-colors hover:text-white"
                style={{ color: "#f5c842" }}
              >
                View all transactions →
              </button>
            </Section>
          </div>
        )}

        {/* ─── SESSIONS TAB ─── */}
        {activeTab === "sessions" && (
          <div className="animate-slide-up">
            <Section title={`All Sessions (${DUMMY_SESSIONS.length})`} icon="💬">
              {DUMMY_SESSIONS.length === 0 ? (
                <EmptyState icon="🌙" message="No sessions yet" sub="Chat with an astrologer to see history" />
              ) : (
                <div className="space-y-3">
                  {DUMMY_SESSIONS.map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ─── TRANSACTIONS TAB ─── */}
        {activeTab === "transactions" && (
          <div className="animate-slide-up">
            <Section title={`Transaction History (${DUMMY_TRANSACTIONS.length})`} icon="💳">
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    label: "Total Added",
                    value: `₹${DUMMY_TRANSACTIONS.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0)}`,
                    color: "#34d399",
                    bg: "rgba(52,211,153,0.06)",
                    border: "rgba(52,211,153,0.15)",
                    icon: "↑",
                  },
                  {
                    label: "Total Spent",
                    value: `₹${DUMMY_TRANSACTIONS.filter((t) => t.type === "DEBIT").reduce((a, t) => a + t.amount, 0)}`,
                    color: "#f87171",
                    bg: "rgba(239,68,68,0.06)",
                    border: "rgba(239,68,68,0.15)",
                    icon: "↓",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="px-5 py-4 rounded-2xl"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <div className="text-xs text-purple-300/50 mb-1">{s.label}</div>
                    <div className="font-cinzel font-bold text-xl" style={{ color: s.color }}>
                      {s.icon} {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {DUMMY_TRANSACTIONS.map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-slide-up">
            {/* Edit profile */}
            <Section title="Edit Profile" icon="✏️">
              <div className="space-y-5 max-w-md">
                {/* Display name */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">
                    Display Name
                  </label>
                  <input
                    id="edit-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="cosmic-input w-full px-4 py-3.5 rounded-xl text-base"
                    placeholder="Your display name"
                  />
                </div>

                {/* Zodiac sign */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">
                    Your Zodiac Sign
                  </label>
                  <button
                    onClick={() => setShowZodiacPicker(!showZodiacPicker)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <span className="text-2xl">{ZODIAC_AVATARS[selectedZodiac]}</span>
                    <span className="text-white font-medium">{ZODIAC_NAMES[selectedZodiac]}</span>
                    <span className="ml-auto text-purple-400/50 text-sm">Change →</span>
                  </button>

                  {showZodiacPicker && (
                    <div
                      className="mt-2 p-4 rounded-2xl grid grid-cols-6 gap-2"
                      style={{
                        background: "rgba(10,6,30,0.98)",
                        border: "1px solid rgba(245,200,66,0.15)",
                      }}
                    >
                      {ZODIAC_AVATARS.map((z, i) => (
                        <button
                          key={i}
                          id={`settings-zodiac-${ZODIAC_NAMES[i].toLowerCase()}`}
                          title={ZODIAC_NAMES[i]}
                          onClick={() => { setSelectedZodiac(i); setShowZodiacPicker(false); }}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl text-xl hover:scale-110 transition-all"
                          style={
                            selectedZodiac === i
                              ? { background: "rgba(245,200,66,0.15)", border: "1px solid rgba(245,200,66,0.35)" }
                              : { background: "rgba(255,255,255,0.04)" }
                          }
                        >
                          {z}
                          <span className="text-xs text-purple-400/50">{ZODIAC_NAMES[i].slice(0, 3)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read-only fields */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">
                    Mobile Number <span className="text-purple-400/40">(cannot be changed)</span>
                  </label>
                  <div
                    className="px-4 py-3.5 rounded-xl text-purple-300/50 text-sm flex items-center gap-2"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    🔒 {user.phone}
                  </div>
                </div>

                {saveSuccess && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm text-center"
                    style={{
                      background: "rgba(52,211,153,0.1)",
                      border: "1px solid rgba(52,211,153,0.2)",
                      color: "#6ee7b7",
                    }}
                  >
                    ✅ Profile updated successfully!
                  </div>
                )}

                <button
                  id="save-profile-btn"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || editName.trim() === user.name}
                  className="btn-gold px-8 py-3.5 rounded-2xl font-bold text-base"
                >
                  {savingProfile ? "Saving…" : "Save Changes ✦"}
                </button>
              </div>
            </Section>

            {/* Danger zone */}
            <Section title="Account" icon="🛡️">
              <div className="space-y-3 max-w-md">
                <div
                  className="px-5 py-4 rounded-2xl flex items-center justify-between"
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.12)",
                  }}
                >
                  <div>
                    <div className="text-red-300 font-medium text-sm">Sign Out</div>
                    <div className="text-red-400/50 text-xs mt-0.5">Sign out of all devices</div>
                  </div>
                  <button
                    id="signout-btn"
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      className="glass-card rounded-2xl p-6"
    >
      <h2 className="font-cinzel font-bold text-white text-lg mb-5 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function SessionRow({ session }: {
  session: { astrologer: string; speciality: string; date: string; duration: string; cost: number; status: string };
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all hover:bg-white/5"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(217,119,6,0.15))",
            border: "1px solid rgba(245,200,66,0.1)",
          }}
        >
          🔮
        </div>
        <div>
          <div className="text-white font-medium text-sm">{session.astrologer}</div>
          <div className="text-purple-400/60 text-xs">{session.speciality} · {session.date}</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-cinzel font-bold text-sm" style={{ color: "#f5c842" }}>
          ₹{session.cost}
        </div>
        <div className="text-purple-400/50 text-xs">{session.duration}</div>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: {
  tx: { type: string; amount: number; reason: string; date: string };
}) {
  const isCredit = tx.type === "CREDIT";
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={
            isCredit
              ? { background: "rgba(52,211,153,0.12)", color: "#34d399" }
              : { background: "rgba(239,68,68,0.1)", color: "#f87171" }
          }
        >
          {isCredit ? "↑" : "↓"}
        </div>
        <div>
          <div className="text-white text-sm font-medium">{tx.reason}</div>
          <div className="text-purple-400/50 text-xs">{tx.date}</div>
        </div>
      </div>
      <div
        className="font-cinzel font-bold text-sm shrink-0"
        style={{ color: isCredit ? "#34d399" : "#f87171" }}
      >
        {isCredit ? "+" : "−"}₹{tx.amount}
      </div>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: string; message: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-cinzel text-white mb-1">{message}</div>
      <div className="text-purple-400/50 text-sm">{sub}</div>
    </div>
  );
}
