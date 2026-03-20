"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ChatSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  status: string;
  user: { name: string };
}

export default function AstrologerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/astrologer/stats")
        .then((r) => r.json())
        .then((d) => {
          if (d.sessions) setSessions(d.sessions);
          if (d.totalEarnings !== undefined) setEarnings(d.totalEarnings);
          if (d.isOnline !== undefined) setIsOnline(d.isOnline);
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function toggleOnline() {
    setTogglingOnline(true);
    const res = await fetch("/api/astrologer/online", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: !isOnline }),
    });
    const data = await res.json();
    setIsOnline(data.isOnline);
    setTogglingOnline(false);
  }

  async function joinChat(chatSessionId: string) {
    // Get socket token for astrologer
    const res = await fetch("/api/chat/socket-token");
    const { token } = await res.json();
    localStorage.setItem(`socket_token_${chatSessionId}`, token);
    router.push(`/astrologer/chat/${chatSessionId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Navbar */}
      <nav className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          🔮 <span>AstroChat</span>
          <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Astrologer</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              isOnline
                ? "bg-green-900/40 text-green-400 border-green-700/40 hover:bg-green-900/60"
                : "bg-gray-800/60 text-gray-400 border-gray-700/40 hover:bg-gray-700/60"
            }`}
          >
            {isOnline ? "● Go Offline" : "○ Go Online"}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-indigo-300 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard ✨</h1>
          <p className="text-indigo-300 mt-1">Welcome back, {session?.user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Earnings", value: `₹${earnings.toFixed(2)}`, icon: "💰" },
            { label: "Total Sessions", value: sessions.length, icon: "💬" },
            { label: "Status", value: isOnline ? "Online" : "Offline", icon: isOnline ? "🟢" : "⚫" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-indigo-300 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chat History */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <div className="text-indigo-400 text-center py-10">No sessions yet. Go online to receive chats!</div>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {s.user.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{s.user.name}</div>
                    <div className="text-indigo-300 text-xs">
                      {new Date(s.startedAt).toLocaleDateString()} · ₹{s.totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "ACTIVE"
                        ? "bg-green-900/40 text-green-400 border border-green-700/40"
                        : "bg-gray-800/50 text-gray-400 border border-gray-700/30"
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.status === "ACTIVE" && (
                    <button
                      onClick={() => joinChat(s.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium transition"
                    >
                      Join Chat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
