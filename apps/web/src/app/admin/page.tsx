"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Analytics {
  totalUsers: number;
  totalAstrologers: number;
  activeSessions: number;
  todayRevenue: number;
  totalRevenue: number;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  walletBalance: number;
  createdAt: string;
}

interface Astrologer {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  astrologerProfile: {
    ratePerMin: number;
    speciality: string;
    isOnline: boolean;
  } | null;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "USERS" | "ASTROLOGERS" | "CREATE">("ANALYTICS");
  
  // Data States
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);

  // Create Astrologer Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [bio, setBio] = useState("");
  const [ratePerMin, setRatePerMin] = useState("15");
  const [experienceYears, setExperienceYears] = useState("0");
  const [languages, setLanguages] = useState("Hindi, English");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/"); // Boot non-admins
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      if (activeTab === "ANALYTICS") {
        fetch("/api/admin/analytics").then(r => r.json()).then(setAnalytics).catch(console.error);
      } else if (activeTab === "USERS") {
        fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(console.error);
      } else if (activeTab === "ASTROLOGERS") {
        fetch("/api/admin/astrologers").then(r => r.json()).then(d => setAstrologers(d.astrologers || [])).catch(console.error);
      }
    }
  }, [activeTab, status, session]);

  if (status === "loading" || session?.user?.role !== "ADMIN") {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Admin Panel...</div>;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/admin/astrologers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name, email, password, speciality, bio, 
        ratePerMin: Number(ratePerMin), 
        experienceYears: Number(experienceYears), 
        languages, 
        profileImage 
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMsg({ text: `Successfully registered ${name}! They can now log in.`, type: "success" });
      setName(""); setEmail(""); setPassword(""); setSpeciality(""); setBio(""); 
      setRatePerMin("15"); setExperienceYears("0"); setLanguages("Hindi, English"); setProfileImage("");
    } else {
      setMsg({ text: data.error || "Failed to register astrologer", type: "error" });
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👑</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-white/50 text-sm">Platform management &amp; monitoring</p>
          </div>
        </div>
        <Link href="/" className="px-5 py-2 border border-white/20 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold max-w-max">
          Exit to CosmicInsight
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-white/10 pb-4">
        {[
          { id: "ANALYTICS", label: "📊 Overview" },
          { id: "ASTROLOGERS", label: "✨ Astrologers" },
          { id: "USERS", label: "👥 Users" },
          { id: "CREATE", label: "➕ Add Astrologer" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id 
              ? "bg-[#f5c842] text-black shadow-lg shadow-amber-500/20" 
              : "bg-[#161616] text-white/70 hover:bg-[#222] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-6xl">
        
        {/* ANALYTICS TAB */}
        {activeTab === "ANALYTICS" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold mb-4">Platform Health</h2>
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Total Users</div>
                  <div className="text-3xl font-extrabold text-[#f5c842]">{analytics.totalUsers}</div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Approved Astrologers</div>
                  <div className="text-3xl font-extrabold text-[#f5c842]">{analytics.totalAstrologers}</div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Active Live Chats</div>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse mr-2" />
                    {analytics.activeSessions}
                  </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Today's Chat Spend</div>
                  <div className="text-3xl font-extrabold text-white">₹{analytics.todayRevenue.toFixed(0)}</div>
                </div>
              </div>
            ) : (
              <div className="text-white/50 text-sm animate-pulse">Loading analytics...</div>
            )}
            
            <div className="mt-8 bg-[#111] border border-white/10 p-6 rounded-2xl max-w-sm">
               <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">All-Time Consultation Spend</div>
               <div className="text-4xl font-extrabold text-white">
                 ₹{analytics?.totalRevenue.toFixed(0) || "—"}
               </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "USERS" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold mb-6">Registered Users</h2>
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#161616] text-white/50 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-4 font-bold">User / Phone</th>
                       <th className="px-6 py-4 font-bold">Joined Date</th>
                       <th className="px-6 py-4 font-bold text-right">Wallet Balance</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {users.length === 0 ? (
                       <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">No users found.</td></tr>
                     ) : (
                       users.map((u) => (
                         <tr key={u.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4">
                             <div className="font-bold text-white">{u.email || "Unknown"}</div>
                             <div className="text-white/40 text-xs font-mono mt-1 w-24 truncate">{u.id}</div>
                           </td>
                           <td className="px-6 py-4 text-white/60">
                             {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className="font-extrabold text-emerald-400">₹{u.walletBalance.toFixed(0)}</span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* ASTROLOGERS TAB */}
        {activeTab === "ASTROLOGERS" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold mb-6">Astrologer Directory</h2>
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#161616] text-white/50 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-4 font-bold">Name & Email</th>
                       <th className="px-6 py-4 font-bold">Speciality</th>
                       <th className="px-6 py-4 font-bold text-center">Rate</th>
                       <th className="px-6 py-4 font-bold text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {astrologers.length === 0 ? (
                       <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No astrologers found.</td></tr>
                     ) : (
                       astrologers.map((a) => (
                         <tr key={a.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4">
                             <div className="font-bold text-white">{a.name}</div>
                             <div className="text-white/40 text-xs mt-0.5">{a.email}</div>
                           </td>
                           <td className="px-6 py-4 text-white/70">
                             {a.astrologerProfile?.speciality || "N/A"}
                           </td>
                           <td className="px-6 py-4 text-center">
                             <div className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono font-bold text-[#f5c842]">
                               ₹{a.astrologerProfile?.ratePerMin || 0}/min
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                             {a.astrologerProfile?.isOnline ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/10 text-stone-400 text-xs font-bold border border-stone-500/20">
                                 Offline
                               </span>
                             )}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* CREATE ASTROLOGER TAB */}
        {activeTab === "CREATE" && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <h2 className="text-xl font-extrabold mb-6">Provision Astrologer Account</h2>
            
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8">
              {msg && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleRegister} className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Login ID (Email/Phone)</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" placeholder="astro@cosmic.chat" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Temporary Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Rate (₹ / Min)</label>
                  <input required type="number" min="1" value={ratePerMin} onChange={e => setRatePerMin(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Experience (Years)</label>
                  <input required type="number" min="0" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Languages</label>
                  <input required value={languages} onChange={e => setLanguages(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" placeholder="Hindi, English" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Speciality</label>
                  <input required value={speciality} onChange={e => setSpeciality(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" placeholder="Vedic, Tarot..." />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Profile Photo URL</label>
                  <input required type="url" value={profileImage} onChange={e => setProfileImage(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all" placeholder="https://example.com/photo.jpg" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Public Biography</label>
                  <textarea required value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f5c842] focus:ring-1 focus:ring-[#f5c842] transition-all resize-none" />
                </div>

                <div className="col-span-2 mt-4">
                  <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-black font-extrabold py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100">
                    {loading ? "Registering..." : "+ Register Astrologer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
