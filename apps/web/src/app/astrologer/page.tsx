"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChatSession {
  id: string;
  userId: string;
  astrologerId: string;
  status: "ACTIVE" | "ENDED" | "CANCELLED";
  startedAt: string;
  endedAt: string | null;
  totalCost: number | null;
  user: { name: string } | null;
}

export default function AstrologerDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [astrologerName, setAstrologerName] = useState("Astro");
  const previousActiveCount = useRef(-1);

  const playChime = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) {
      console.error("Audio chime failed to play", e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/astrologer/stats");
      if (!res.ok) return;
      const data = await res.json();
      
      const list = (data.sessions || []).map((s: ChatSession & { duration?: number }) => ({
        ...s,
        duration: s.duration ?? 0,
      }));
      setSessions(list);
      
      const activeNow = list.filter((s: ChatSession) => s.status === "ACTIVE").length;
      if (previousActiveCount.current !== -1 && activeNow > previousActiveCount.current) {
        playChime();
      }
      previousActiveCount.current = activeNow;

      setIsOnline(!!data.isOnline);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [playChime]);

  useEffect(() => {
    fetch("/api/astrologer/profile")
      .then((r) => r.json())
      .then((d) => { if (d?.name) setAstrologerName(d.name); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const toggleOnline = async () => {
    if (togglingOnline) return;
    setTogglingOnline(true);
    try {
      const targetState = !isOnline;
      const res = await fetch("/api/astrologer/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: targetState }),
      });
      if (res.ok) setIsOnline(targetState);
    } catch (err) {
      console.error("Status toggle error:", err);
    } finally {
      setTogglingOnline(false);
    }
  };

  const joinChat = (sessionId: string) => {
    router.push(`/astrologer/chat/${sessionId}`);
  };

  const totalEarnings = sessions.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,200,66,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-sm">✨</span>
          <span className="font-cinzel text-xl font-bold tracking-wider" style={{ color: "#FF9933" }}>
            CosmicChat
          </span>
          <span
            className="ml-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline-block"
            style={{
              background: "rgba(255,153,51,0.1)",
              border: "1px solid rgba(255,153,51,0.25)",
              color: "#e67e22",
            }}
          >
            Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Ledger */}
          <button
            onClick={() => router.push("/transactions")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 bg-white shadow-sm border border-[#f5c842]/30"
          >
            <span className="text-sm">📜</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Earnings</div>
              <div className="font-bold text-[13px] font-cinzel text-slate-700">
                Ledger
              </div>
            </div>
          </button>

          {/* Online toggle */}
          <button
            id="online-toggle-btn"
            onClick={toggleOnline}
            disabled={togglingOnline}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest cursor-pointer shadow-sm hover:scale-105"
            style={
              isOnline
                ? {
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#059669",
                  }
                : {
                    background: "rgba(241,245,249,1)",
                    border: "1px solid rgba(203,213,225,1)",
                    color: "#64748b",
                  }
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              style={isOnline ? { boxShadow: "0 0 8px #10b981" } : {}}
            />
            {togglingOnline ? "Syncing…" : isOnline ? "Online" : "Go Online"}
          </button>

          {/* Avatar → Settings */}
          <Link
            href="/astrologer/settings"
            id="astro-settings-nav-btn"
            className="w-10 h-10 ml-2 rounded-full flex items-center justify-center font-bold text-sm hover:scale-110 transition-transform shadow-md border-2 border-white"
            style={{
              background: "linear-gradient(135deg, #FF9933, #f5c842)",
              color: "white",
            }}
            title="Account Settings"
          >
            {astrologerName[0]}
          </Link>

          <button
            onClick={() => router.push("/login")}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-4 font-bold uppercase tracking-wider"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Block */}
        <div className="mb-10 pl-4 border-l-4 border-[#FF9933]">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Your Dashboard <span className="opacity-80 text-2xl ml-1">✨</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">
            Welcome back, {astrologerName}. Here's your cosmic overview.
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
              color: "#e67e22",
              bg: "bg-white",
            },
            {
              icon: "💬",
              label: "Total Sessions",
              value: totalSessions,
              sub: `${activeSessions.length} active`,
              color: "#8b5cf6",
              bg: "bg-white",
            },
            {
              icon: "⭐",
              label: "Avg Rating",
              value: "—",
              sub: "No reviews yet",
              color: "#f5c842",
              bg: "bg-white",
            },
            {
              icon: isOnline ? "🟢" : "⚫",
              label: "Status",
              value: isOnline ? "Online" : "Offline",
              sub: isOnline ? "Receiving energy" : "Toggle to go live",
              color: isOnline ? "#10b981" : "#64748b",
              bg: isOnline ? "bg-emerald-50" : "bg-white",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} border border-slate-100 shadow-sm rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1`}
            >
              <div className="text-3xl mb-3 drop-shadow-sm">{stat.icon}</div>
              <div
                className="font-cinzel text-3xl font-extrabold mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-slate-700 text-[13px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
              <div className="text-slate-400 text-xs font-semibold">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── ACTIVE SESSIONS ─── */}
        {activeSessions.length > 0 && (
          <div className="mb-10">
            <h2 className="font-cinzel text-2xl font-bold text-slate-800 mb-5 flex items-center gap-3 border-b border-slate-200 pb-3">
              <span
                className="w-3 h-3 rounded-full bg-emerald-400 inline-block animate-pulse"
                style={{ boxShadow: "0 0 10px #34d399" }}
              />
              Active Sessions
              <span className="ml-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#34d399]/10 text-[#059669] border border-[#34d399]/20 shadow-sm">
                {activeSessions.length} live
              </span>
            </h2>
            <div className="space-y-4">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 rounded-2xl bg-white shadow-[0_4px_15px_rgba(52,211,153,0.15)] border-l-4 border-l-emerald-400 group hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-5 mb-4 sm:mb-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-inner bg-slate-50 border border-slate-200 text-slate-500"
                    >
                      {(s.user?.name || "U")[0]}
                    </div>
                    <div>
                      <div className="text-slate-800 font-extrabold text-lg tracking-tight mb-1">{s.user?.name || "User"}</div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded-full inline-block bg-slate-50">
                        Started {formatTime(s.startedAt)} · <span className="text-[#e67e22]">₹{s.totalCost?.toFixed(0) || 0}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    id={`join-chat-${s.id}`}
                    onClick={() => joinChat(s.id)}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide hover:shadow-lg shadow-sm transition-transform hover:scale-105"
                  >
                    🔮 Join Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── OFFLINE PROMPT ─── */}
        {!isOnline && (
          <div className="mb-10 px-6 py-6 rounded-2xl flex items-center justify-between gap-5 bg-orange-50 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-4xl drop-shadow-sm">💡</span>
              <div>
                <div className="text-orange-600 font-extrabold text-sm tracking-wide">You're currently offline</div>
                <div className="text-orange-500/80 text-xs font-bold mt-1">Go online to start receiving spiritual consultation requests</div>
              </div>
            </div>
            <button
              onClick={toggleOnline}
              disabled={togglingOnline}
              className="bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide hover:shadow-lg shadow-sm transition-transform hover:scale-105 shrink-0"
            >
              Go Online
            </button>
          </div>
        )}

        {/* ─── SESSION HISTORY ─── */}
        <div>
          <h2 className="font-cinzel text-xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
            <span>Session History</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-white shadow-sm border border-slate-100 px-3 py-1 rounded-full">
              {sessions.length} total
            </span>
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl py-20 text-center border border-slate-100 shadow-sm">
              <div className="text-4xl mb-4 animate-spin opacity-40">🪷</div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading energies…</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl py-20 text-center border border-slate-100 shadow-sm">
              <div className="text-5xl mb-4 drop-shadow-sm opacity-60">🌙</div>
              <div className="text-slate-800 font-cinzel text-xl font-bold mb-2">No consults yet</div>
              <div className="text-slate-500 text-sm font-medium">Toggle online to start receiving chats</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions
                .filter((s) => s.status === "ENDED")
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 rounded-2xl border border-slate-100 shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-5 mb-3 sm:mb-0">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0 bg-[#faf8f5] shadow-inner text-slate-700 border border-slate-200"
                      >
                        {(s.user?.name || "U")[0]}
                      </div>
                      <div>
                        <div className="text-slate-800 font-extrabold text-[15px] mb-1">{s.user?.name || "User"}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          {formatDate(s.startedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end ml-16 sm:ml-0">
                      <div className="text-right flex flex-col items-start sm:items-end">
                        <div className="font-cinzel font-bold text-xl drop-shadow-sm" style={{ color: "#10b981" }}>
                          + ₹{s.totalCost?.toFixed(0) || 0}
                        </div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Earned</div>
                      </div>
                      <span
                        className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
                        style={{
                          background: "rgba(241,245,249,1)",
                          border: "1px solid rgba(203,213,225,1)",
                          color: "#64748b",
                        }}
                      >
                        Ended
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Admin Panel Link Footer */}
      <footer className="py-8 text-center mt-auto border-t border-slate-200 bg-white">
        <Link href="/admin" className="text-[10px] uppercase font-extrabold tracking-widest px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm">
          👑 View Admin Panel Prototype
        </Link>
      </footer>
    </div>
  );
}
