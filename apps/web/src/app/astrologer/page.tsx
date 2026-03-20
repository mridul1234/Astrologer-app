"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  status: "ACTIVE" | "ENDED";
  user: { name: string; phone: string };
  duration: number; // minutes
}

// Dummy sessions data
const DUMMY_SESSIONS: ChatSession[] = [
  {
    id: "s1",
    userId: "u1",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    endedAt: null,
    totalCost: 120,
    status: "ACTIVE",
    user: { name: "Rahul M.", phone: "98765*****" },
    duration: 4,
  },
  {
    id: "s2",
    userId: "u2",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 82800000).toISOString(),
    totalCost: 450,
    status: "ENDED",
    user: { name: "Priya S.", phone: "91234*****" },
    duration: 18,
  },
  {
    id: "s3",
    userId: "u3",
    startedAt: new Date(Date.now() - 172800000).toISOString(),
    endedAt: new Date(Date.now() - 169200000).toISOString(),
    totalCost: 225,
    status: "ENDED",
    user: { name: "Ananya K.", phone: "87654*****" },
    duration: 9,
  },
  {
    id: "s4",
    userId: "u4",
    startedAt: new Date(Date.now() - 259200000).toISOString(),
    endedAt: new Date(Date.now() - 255600000).toISOString(),
    totalCost: 600,
    status: "ENDED",
    user: { name: "Vikram T.", phone: "99887*****" },
    duration: 24,
  },
];

export default function AstrologerDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [sessions] = useState<ChatSession[]>(DUMMY_SESSIONS);
  const [astrologerName] = useState("Pandit Ravi Sharma");

  const totalEarnings = sessions.reduce((acc, s) => acc + s.totalCost, 0);
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");

  async function toggleOnline() {
    setTogglingOnline(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsOnline((v) => !v);
    setTogglingOnline(false);
  }

  async function joinChat(sessionId: string) {
    router.push(`/astrologer/chat/${sessionId}`);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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
          <span
            className="ml-2 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(245,200,66,0.1)",
              border: "1px solid rgba(245,200,66,0.25)",
              color: "#f5c842",
            }}
          >
            Astrologer Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Online toggle */}
          <button
            id="online-toggle-btn"
            onClick={toggleOnline}
            disabled={togglingOnline}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              isOnline
                ? {
                    background: "rgba(52,211,153,0.12)",
                    border: "1px solid rgba(52,211,153,0.25)",
                    color: "#34d399",
                  }
                : {
                    background: "rgba(107,114,128,0.1)",
                    border: "1px solid rgba(107,114,128,0.2)",
                    color: "rgba(156,163,175,0.8)",
                  }
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-gray-500"}`}
              style={isOnline ? { boxShadow: "0 0 6px #34d399" } : {}}
            />
            {togglingOnline ? "Updating…" : isOnline ? "Online" : "Go Online"}
          </button>

          {/* Avatar → Settings */}
          <Link
            href="/astrologer/settings"
            id="astro-settings-nav-btn"
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm hover:scale-110 transition-transform"
            style={{
              background: "linear-gradient(135deg, #d97706, #7c3aed)",
              color: "white",
            }}
            title="Account Settings"
          >
            {astrologerName[0]}
          </Link>

          <Link
            href="/astrologer/settings"
            id="astro-settings-link"
            className="text-sm text-purple-300/60 hover:text-white transition-colors"
          >
            Settings
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
            Your Dashboard ✨
          </h1>
          <p className="text-purple-300/60">
            Welcome back, {astrologerName}. Here&apos;s your cosmic overview.
          </p>
        </div>

        {/* ─── STATS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: "💰",
              label: "Total Earnings",
              value: `₹${totalEarnings.toLocaleString()}`,
              sub: "All time",
              color: "#f5c842",
            },
            {
              icon: "💬",
              label: "Total Sessions",
              value: totalSessions,
              sub: `${activeSessions.length} active`,
              color: "#c4b5fd",
            },
            {
              icon: "⭐",
              label: "Avg Rating",
              value: "4.9 ★",
              sub: "128 reviews",
              color: "#fde68a",
            },
            {
              icon: isOnline ? "🟢" : "⚫",
              label: "Status",
              value: isOnline ? "Online" : "Offline",
              sub: isOnline ? "Accepting chats" : "Toggle to go live",
              color: isOnline ? "#34d399" : "#6b7280",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-5 text-center hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div
                className="font-cinzel text-2xl font-bold mb-0.5"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-white text-sm font-medium">{stat.label}</div>
              <div className="text-purple-400/50 text-xs mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── ACTIVE SESSIONS ─── */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="font-cinzel text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"
                style={{ boxShadow: "0 0 8px #34d399" }}
              />
              Active Sessions
            </h2>
            <div className="space-y-3">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl"
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.15)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(124,58,237,0.2))",
                        border: "1px solid rgba(52,211,153,0.2)",
                        color: "#6ee7b7",
                      }}
                    >
                      {s.user.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{s.user.name}</div>
                      <div className="text-green-400/70 text-xs">
                        Started {formatTime(s.startedAt)} · {s.duration} min · ₹{s.totalCost}
                      </div>
                    </div>
                  </div>
                  <button
                    id={`join-chat-${s.id}`}
                    onClick={() => joinChat(s.id)}
                    className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold"
                  >
                    🔮 Join Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── OFFLINE PROMPT ─── */}
        {!isOnline && (
          <div
            className="mb-8 px-6 py-5 rounded-2xl flex items-center justify-between gap-4"
            style={{
              background: "rgba(245,200,66,0.05)",
              border: "1px solid rgba(245,200,66,0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <div className="text-yellow-200 font-medium text-sm">You&apos;re currently offline</div>
                <div className="text-purple-300/50 text-xs">Go online to start receiving consultation requests</div>
              </div>
            </div>
            <button
              onClick={toggleOnline}
              disabled={togglingOnline}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold shrink-0"
            >
              Go Online
            </button>
          </div>
        )}

        {/* ─── SESSION HISTORY ─── */}
        <div>
          <h2 className="font-cinzel text-xl font-bold text-white mb-5 flex items-center justify-between">
            <span>Session History</span>
            <span className="text-sm font-normal text-purple-400/50 font-sans">
              {sessions.length} total sessions
            </span>
          </h2>

          {sessions.length === 0 ? (
            <div
              className="glass-card rounded-2xl py-16 text-center"
            >
              <div className="text-5xl mb-4">🌙</div>
              <div className="text-purple-300/60 font-cinzel">No sessions yet</div>
              <div className="text-purple-400/40 text-sm mt-1">Go online to start receiving chats</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="glass-card flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.2))",
                        color: "#c4b5fd",
                      }}
                    >
                      {s.user.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{s.user.name}</div>
                      <div className="text-purple-400/60 text-xs">
                        {formatDate(s.startedAt)} · {s.duration} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-cinzel font-bold text-sm" style={{ color: "#f5c842" }}>
                        ₹{s.totalCost}
                      </div>
                      <div className="text-purple-400/50 text-xs">earned</div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        s.status === "ACTIVE"
                          ? {
                              background: "rgba(52,211,153,0.12)",
                              border: "1px solid rgba(52,211,153,0.25)",
                              color: "#34d399",
                            }
                          : {
                              background: "rgba(107,114,128,0.1)",
                              border: "1px solid rgba(107,114,128,0.15)",
                              color: "rgba(156,163,175,0.7)",
                            }
                      }
                    >
                      {s.status === "ACTIVE" ? "● Active" : "Ended"}
                    </span>

                    {s.status === "ACTIVE" && (
                      <button
                        onClick={() => joinChat(s.id)}
                        className="btn-gold px-4 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Admin Panel Link Footer */}
      <footer className="py-6 text-center border-t border-white/5 mt-auto">
        <Link href="/admin" className="text-xs font-semibold px-4 py-2 rounded-full border border-white/10 text-purple-300/60 hover:text-white hover:bg-white/5 transition">
          👑 View Admin Panel Prototype
        </Link>
      </footer>
    </div>
  );
}
