"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Clean Slate — no dummy data ──────────────────────────────────────────────
const STATS = {
  totalUsers: 0,
  totalAstrologers: 0,
  activeSessions: 0,
  totalRevenue: 0,
  pendingPayouts: 0,
};

const DUMMY_USERS: { id: string; name: string; email: string; phone: string; balance: number; status: string; joined: string }[] = [];
const DUMMY_ASTROLOGERS: { id: string; name: string; spec: string; rate: number; earned: number; status: string; isOnline: boolean }[] = [];
const DUMMY_TRANSACTIONS: { id: string; user: string; type: string; amount: number; date: string; status: string; ref?: string }[] = [];

type Tab = "overview" | "users" | "astrologers" | "finances" | "approvals";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const tabStyle = (t: Tab) =>
    activeTab === t
      ? {
          background: "linear-gradient(135deg, rgba(245,200,66,0.15), rgba(124,58,237,0.15))",
          border: "1px solid rgba(245,200,66,0.3)",
          color: "#f5c842",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(196,181,253,0.6)",
        };

  return (
    <div className="min-h-screen pb-20" style={{ position: "relative", zIndex: 1 }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,5,25,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <span className="font-cinzel text-xl font-bold text-white">
            Admin<span style={{ color: "#f5c842" }}>Control</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            Super Admin
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-purple-300/60 hover:text-white transition-colors">
            Exit to Site
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-white mb-1">Command Center</h1>
            <p className="text-purple-300/60 text-sm">Manage users, astrologers, and finances globally.</p>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
            <input
              type="text"
              placeholder="Search ID, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cosmic-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
          {(
            [
              { id: "overview", label: "📊 Overview" },
              { id: "users", label: "👥 Manage Users" },
              { id: "astrologers", label: "🔮 Manage Astrologers" },
              { id: "approvals", label: "✅ Onboarding Approvals (1)" },
              { id: "finances", label: "💰 Finances & Payouts" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={tabStyle(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <div className="animate-slide-up">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={STATS.totalUsers.toLocaleString()} icon="👥" color="#60a5fa" />
                <StatCard title="Total Astrologers" value={STATS.totalAstrologers.toLocaleString()} icon="🔮" color="#f5c842" />
                <StatCard title="Active Sessions" value={STATS.activeSessions} icon="💬" color="#34d399" live />
                <StatCard title="Total Platform Revenue" value={`₹${(STATS.totalRevenue / 100000).toFixed(2)}L`} icon="💰" color="#c084fc" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Recent Live Sessions" subtitle="Currently active chats taking place on the platform.">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-wrap items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34d399" }}></span>
                            <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#10b981" }}></span>
                          </span>
                          <div>
                            <div className="text-sm font-medium text-white flex gap-2">
                              {DUMMY_USERS[i % 2].name} <span className="text-purple-400/50">↔</span> {DUMMY_ASTROLOGERS[i % 2].name}
                            </div>
                            <div className="text-xs text-purple-300/50 mr-2">Session running for {i * 4 + 2}m</div>
                          </div>
                        </div>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition mt-2 sm:mt-0">Force Terminate</button>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Quick Actions">
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-xl text-left hover:bg-white/5 transition border border-white/5 group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">✅</div>
                      <div className="text-sm font-bold text-white mb-1">Review Astrologers</div>
                      <div className="text-xs text-purple-400/50">1 pending approval</div>
                    </button>
                    <button className="p-4 rounded-xl text-left hover:bg-white/5 transition border border-white/5 group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">💸</div>
                      <div className="text-sm font-bold text-white mb-1">Process Payouts</div>
                      <div className="text-xs text-purple-400/50">3 requests pending</div>
                    </button>
                    <button className="p-4 rounded-xl text-left hover:bg-white/5 transition border border-white/5 group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">⚙️</div>
                      <div className="text-sm font-bold text-white mb-1">Platform Rules</div>
                      <div className="text-xs text-purple-400/50">Edit commissions</div>
                    </button>
                    <button className="p-4 rounded-xl text-left hover:bg-white/5 transition border border-white/5 group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">📣</div>
                      <div className="text-sm font-bold text-white mb-1">Broadcast Alert</div>
                      <div className="text-xs text-purple-400/50">Send mass notification</div>
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === "users" && (
            <SectionCard title="Seekers (Users) Database">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-purple-300/60 uppercase border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User Info</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 font-semibold">Wallet Bal</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DUMMY_USERS.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-4">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-xs text-purple-400/50">Joined {u.joined}</div>
                        </td>
                        <td className="px-4 py-4 text-purple-200/80">
                          <div>{u.email}</div>
                          <div className="text-xs opacity-60">{u.phone}</div>
                        </td>
                        <td className="px-4 py-4 font-cinzel font-bold text-green-400">₹{u.balance}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition mr-2">Edit Bal</button>
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Ban</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* TAB: ASTROLOGERS */}
          {activeTab === "astrologers" && (
            <SectionCard title="Astrologer Roster">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-purple-300/60 uppercase border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Astrologer</th>
                      <th className="px-4 py-3 font-semibold">Rate/Min</th>
                      <th className="px-4 py-3 font-semibold">Lifetime Earned</th>
                      <th className="px-4 py-3 font-semibold">Live Status</th>
                      <th className="px-4 py-3 font-semibold">Acc Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DUMMY_ASTROLOGERS.filter(a => a.status !== "Pending").map((a) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-4">
                          <div className="font-bold text-white">{a.name}</div>
                          <div className="text-xs text-purple-400/50">{a.spec}</div>
                        </td>
                        <td className="px-4 py-4 font-cinzel font-bold">₹{a.rate}</td>
                        <td className="px-4 py-4 font-cinzel font-bold text-yellow-400">₹{a.earned.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          {a.isOnline ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400"></span> Online</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Offline</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === 'Approved' ? 'text-blue-400' : 'text-red-400'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition mr-2">Edit</button>
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Suspend</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* TAB: APPROVALS */}
          {activeTab === "approvals" && (
            <SectionCard title="Pending Astrologer Approvals">
              <div className="space-y-4">
                {DUMMY_ASTROLOGERS.filter(a => a.status === "Pending").map(a => (
                  <div key={a.id} className="px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <div>
                      <div className="font-cinzel font-bold text-lg text-white mb-1">{a.name}</div>
                      <div className="text-sm text-purple-200/70 mb-2">{a.spec} · Wants to charge ₹{a.rate}/min</div>
                      <div className="text-xs text-blue-300">Application submitted 2 days ago</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition">Approve</button>
                      <button className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition">Reject</button>
                      <button className="px-4 py-2 rounded-xl text-sm font-bold border border-white/10 hover:bg-white/10 transition">View Docs</button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* TAB: FINANCES */}
          {activeTab === "finances" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl glass-card text-center">
                  <div className="text-sm text-purple-300/60 mb-1">Company Profit (30% cut)</div>
                  <div className="text-3xl font-cinzel font-black text-green-400">₹{(STATS.totalRevenue * 0.3).toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl glass-card text-center">
                  <div className="text-sm text-purple-300/60 mb-1">Astrologer Earnings (70%)</div>
                  <div className="text-3xl font-cinzel font-black text-white">₹{(STATS.totalRevenue * 0.7).toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl glass-card text-center border-yellow-500/30" style={{ border: "1px solid rgba(245,200,66,0.3)", background: "rgba(245,200,66,0.05)" }}>
                  <div className="text-sm text-purple-300/60 mb-1">Pending Payouts to Astros</div>
                  <div className="text-3xl font-cinzel font-black text-yellow-400">₹{STATS.pendingPayouts.toLocaleString()}</div>
                  <button className="mt-3 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full hover:bg-yellow-400/20">Review 3 Requests →</button>
                </div>
              </div>

              <SectionCard title="Recent Transactions Logic / Ledger">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-purple-300/60 uppercase border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Tx ID</th>
                        <th className="px-4 py-3 font-semibold">User/Entity</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DUMMY_TRANSACTIONS.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-4 text-xs font-mono text-purple-400/50">{tx.id.toUpperCase()}</td>
                          <td className="px-4 py-4 font-medium text-white">{tx.user}</td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                              {tx.type} {tx.ref && <span className="opacity-50">· {tx.ref}</span>}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-cinzel font-bold text-white">
                            {tx.type === "CHAT_DEDUCT" || tx.type === "PAYOUT" ? "-" : "+"}₹{tx.amount}
                          </td>
                          <td className="px-4 py-4 text-purple-200/60">{tx.date}</td>
                          <td className="px-4 py-4">
                            <span className={tx.status === "Success" ? "text-green-400" : tx.status === "Failed" ? "text-red-400" : "text-yellow-400"}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, live = false }: { title: string; value: string | number; icon: string; color: string; live?: boolean }) {
  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150" style={{ background: color }} />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}20`, color: color }}>
          {icon}
        </div>
        {live && (
          <span className="px-2 py-0.5 rounded flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-400 bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Live
          </span>
        )}
      </div>
      <div className="font-cinzel text-3xl font-black text-white mb-1 shadow-sm">{value}</div>
      <div className="text-sm font-medium text-purple-300/60">{title}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="font-cinzel font-bold text-white text-xl mb-1">{title}</h2>
      {subtitle && <p className="text-purple-300/60 text-sm mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}
