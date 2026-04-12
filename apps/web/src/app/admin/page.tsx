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
  const [categories, setCategories] = useState<string[]>([]);
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
        name, email, password, speciality, categories, 
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
      setName(""); setEmail(""); setPassword(""); setSpeciality(""); setCategories([]); 
      setRatePerMin("15"); setExperienceYears("0"); setLanguages("Hindi, English"); setProfileImage("");
    } else {
      setMsg({ text: data.error || "Failed to register astrologer", type: "error" });
    }
  }

  async function handleDeleteAstrologer(id: string, name: string | null) {
    if (!confirm(`Are you sure you want to completely remove astrologer ${name || "Unknown"} from the platform? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/astrologers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAstrologers(prev => prev.filter(a => a.id !== id));
        alert(`Astrologer ${name || "Unknown"} removed successfully.`);
      } else {
        const data = await res.json();
        alert(`Failed to remove: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the astrologer.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800 p-6 md:p-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-amber-800 text-lg">👑</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Admin Console</h1>
            <p className="text-stone-500 text-sm font-medium">Platform management &amp; monitoring</p>
          </div>
        </div>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-white border border-[#f5c842]/60 text-stone-800 font-extrabold text-sm hover:bg-[#f5c842] hover:shadow-md hover:shadow-amber-200/50 transition-all duration-200 max-w-max">
          Exit to AstroWalla
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-stone-200 pb-4">
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
              ? "bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 shadow-md shadow-amber-200/50" 
              : "bg-white border border-stone-200 text-stone-500 hover:border-[#f5c842]/60 hover:text-[#d97706]"
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
            <h2 className="text-xl font-extrabold text-stone-900 mb-4">Platform Health</h2>
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-100 shadow-sm p-6 rounded-3xl hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Total Users</div>
                  <div className="text-3xl font-extrabold text-stone-900">{analytics.totalUsers}</div>
                </div>
                <div className="bg-white border border-stone-100 shadow-sm p-6 rounded-3xl hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Approved Astrologers</div>
                  <div className="text-3xl font-extrabold text-stone-900">{analytics.totalAstrologers}</div>
                </div>
                <div className="bg-white border border-emerald-100 shadow-sm p-6 rounded-3xl hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full pointer-events-none" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Active Live Chats</div>
                  <div className="text-3xl font-extrabold text-emerald-600 flex items-center">
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse mr-2 shadow-sm shadow-emerald-400/50" />
                    {analytics.activeSessions}
                  </div>
                </div>
                <div className="bg-white border border-stone-100 shadow-sm p-6 rounded-3xl hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Today's Chat Spend</div>
                  <div className="text-3xl font-extrabold text-[#d97706]">₹{analytics.todayRevenue.toFixed(0)}</div>
                </div>
              </div>
            ) : (
              <div className="text-stone-500 font-medium text-sm animate-pulse">Loading analytics...</div>
            )}
            
            <div className="mt-8 bg-gradient-to-r from-[#fef9ec] to-[#fef3c7] border border-[#f0e6c8] shadow-sm p-8 rounded-3xl max-w-sm relative overflow-hidden">
               <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#f5c842]/10 pointer-events-none" />
               <div className="text-[10px] font-bold uppercase tracking-widest text-[#d97706] mb-2 relative z-10">All-Time Consultation Spend</div>
               <div className="text-4xl font-extrabold text-stone-900 relative z-10">
                 ₹{analytics?.totalRevenue.toFixed(0) || "—"}
               </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "USERS" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold text-stone-900 mb-6">Registered Users</h2>
            <div className="bg-white border border-stone-100 shadow-sm rounded-3xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-widest border-b border-stone-100">
                     <tr>
                       <th className="px-6 py-4 font-bold">User / Phone</th>
                       <th className="px-6 py-4 font-bold">Joined Date</th>
                       <th className="px-6 py-4 font-bold text-right">Wallet Balance</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                     {users.length === 0 ? (
                       <tr><td colSpan={3} className="px-6 py-12 text-center text-stone-400 font-medium border-b border-stone-50">No users found.</td></tr>
                     ) : (
                       users.map((u) => (
                         <tr key={u.id} className="hover:bg-amber-50/30 transition-colors group">
                           <td className="px-6 py-4">
                             <div className="font-bold text-stone-800 group-hover:text-[#d97706] transition-colors">{u.email || "Unknown"}</div>
                             <div className="text-stone-400 text-[11px] font-mono mt-1 font-semibold">{u.id.slice(0, 12)}...</div>
                           </td>
                           <td className="px-6 py-4 text-stone-500 font-medium">
                             {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs">
                               ₹{u.walletBalance.toFixed(0)}
                             </span>
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
            <h2 className="text-xl font-extrabold text-stone-900 mb-6">Astrologer Directory</h2>
            <div className="bg-white border border-stone-100 shadow-sm rounded-3xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-widest border-b border-stone-100">
                     <tr>
                       <th className="px-6 py-4 font-bold">Name & Email</th>
                       <th className="px-6 py-4 font-bold">Speciality</th>
                       <th className="px-6 py-4 font-bold text-center">Rate</th>
                       <th className="px-6 py-4 font-bold text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                     {astrologers.length === 0 ? (
                       <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-medium border-b border-stone-50">No astrologers found.</td></tr>
                     ) : (
                       astrologers.map((a) => (
                         <tr key={a.id} className="hover:bg-amber-50/30 transition-colors group">
                           <td className="px-6 py-4">
                             <div className="font-bold text-stone-800 group-hover:text-[#d97706] transition-colors">{a.name}</div>
                             <div className="text-stone-400 text-xs mt-0.5 font-medium">{a.email}</div>
                           </td>
                           <td className="px-6 py-4 text-stone-600 font-medium">
                             {a.astrologerProfile?.speciality || "N/A"}
                           </td>
                           <td className="px-6 py-4 text-center">
                             <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 font-mono font-bold text-[#d97706] text-xs">
                               ₹{a.astrologerProfile?.ratePerMin || 0}/min
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleDeleteAstrologer(a.id, a.name)}
                               className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                             >
                               Remove
                             </button>
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
            <h2 className="text-xl font-extrabold text-stone-900 mb-6">Provision Astrologer Account</h2>
            
            <div className="bg-white border border-stone-100 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#fef3c7] to-transparent pointer-events-none opacity-50" />

              {msg && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleRegister} className="grid grid-cols-2 gap-5 relative z-10">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" placeholder="e.g. Guruji Sharma" />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Login ID (Email/Phone)</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" placeholder="astro@astrowallaat" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Temporary Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Rate (₹ / Min)</label>
                  <input required type="number" min="1" value={ratePerMin} onChange={e => setRatePerMin(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Experience (Years)</label>
                  <input required type="number" min="0" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Languages</label>
                  <input required value={languages} onChange={e => setLanguages(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" placeholder="Hindi, English" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Speciality</label>
                  <input required value={speciality} onChange={e => setSpeciality(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" placeholder="Vedic, Tarot..." />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Categories (Multi-Select)</label>
                  <div className="flex flex-wrap gap-2">
                    {["Love", "Education", "Career", "Marriage", "Health", "Wealth"].map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          categories.includes(cat)
                            ? "bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 border-2 border-transparent shadow-sm"
                            : "bg-[#fdfaf5] text-stone-500 border border-stone-200 hover:border-[#f5c842]/60 hover:text-[#d97706]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 mt-1">Profile Photo URL</label>
                  <input required type="url" value={profileImage} onChange={e => setProfileImage(e.target.value)} className="w-full bg-[#fdfaf5] border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all placeholder:text-stone-400" placeholder="https://example.com/photo.jpg" />
                </div>


                <div className="col-span-2 mt-6">
                  <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-200/60 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:active:scale-100">
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
