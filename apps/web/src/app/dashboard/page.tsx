"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Astrologer {
  id: string;
  speciality: string;
  ratePerMin: number;
  isOnline: boolean;
  user: { name: string };
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [balance, setBalance] = useState(0);
  const [starting, setStarting] = useState<string | null>(null);
  const [addingBalance, setAddingBalance] = useState(false);

  useEffect(() => {
    fetch("/api/astrologers").then((r) => r.json()).then(setAstrologers);
    fetch("/api/user/wallet").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0));
  }, []);

  async function startChat(astrologerId: string) {
    setStarting(astrologerId);
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ astrologerId }),
    });
    const data = await res.json();
    setStarting(null);

    if (!res.ok) {
      alert(data.error || "Failed to start chat");
      return;
    }
    // Store socket token for the chat page
    localStorage.setItem(`socket_token_${data.sessionId}`, data.socketToken);
    router.push(`/dashboard/chat/${data.sessionId}`);
  }

  async function addTestBalance() {
    setAddingBalance(true);
    const res = await fetch("/api/user/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000 }),
    });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
    setAddingBalance(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      {/* Navbar */}
      <nav className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          🔮 <span>AstroChat</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-purple-300">Wallet Balance</div>
            <div className={`font-bold ${balance < 20 ? "text-red-400" : "text-green-400"}`}>
              ₹{balance.toFixed(2)}
            </div>
          </div>
          <button
            onClick={addTestBalance}
            disabled={addingBalance}
            className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition font-medium"
          >
            {addingBalance ? "Adding..." : "+ ₹1000 Test"}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-purple-300 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome, {session?.user?.name?.split(" ")[0]} ✨
          </h1>
          <p className="text-purple-300 mt-1">Connect with an astrologer and seek cosmic guidance</p>
        </div>

        {/* Astrologers Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {astrologers.length === 0 && (
            <div className="col-span-3 text-center text-purple-400 py-16">No astrologers available yet.</div>
          )}
          {astrologers.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-6 flex flex-col gap-4 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xl">
                  🔮
                </div>
                <div>
                  <div className="text-white font-semibold">{a.user.name}</div>
                  <div className="text-purple-300 text-xs">{a.speciality}</div>
                </div>
                <div className="ml-auto">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.isOnline
                        ? "bg-green-900/40 text-green-400 border border-green-700/40"
                        : "bg-gray-800/60 text-gray-400 border border-gray-700/40"
                    }`}
                  >
                    {a.isOnline ? "● Online" : "○ Offline"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-purple-200 text-sm">
                  <span className="font-bold text-white">₹{a.ratePerMin}</span>/min
                </div>
                <button
                  onClick={() => startChat(a.id)}
                  disabled={!a.isOnline || !!starting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 transition"
                >
                  {starting === a.id ? "Starting..." : "Chat Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
