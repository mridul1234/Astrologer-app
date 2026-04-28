"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import VedicLoader from "../../components/VedicLoader";
import { supabase } from "@/lib/supabaseClient";

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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
  user?: { name: string } | null;
}

interface AstrologerProfile {
  bio: string | null;
  speciality: string | null;
  languages: string | null;
  ratePerMin: number;
  profileImage?: string | null;
}

export default function AstrologerPortal() {
  const router = useRouter();
  
  // State 
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<AstrologerProfile>({ bio: "", speciality: "", languages: "", ratePerMin: 0 });
  const [isOnline, setIsOnline] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [astrologerName, setAstrologerName] = useState("Astrologer");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [avgRating, setAvgRating] = useState(0);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "reviews" | "wallet" | "settings">("dashboard");

  // Settings Form State
  const [isUpdating, setIsUpdating] = useState(false);
  const [editProfile, setEditProfile] = useState<AstrologerProfile>({ bio: "", speciality: "", languages: "", ratePerMin: 0, profileImage: "" });
  const [editProfileImageFile, setEditProfileImageFile] = useState<File | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Timers
  const previousActiveCount = useRef(-1);
  const [now, setNow] = useState(Date.now());

  // Update clock every second for countdowns
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

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

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch("/api/astrologer/profile");
      if (!res.ok) {
        if (res.status === 401) router.push("/login"); // Force login if unauthorized
        return;
      }
      const data = await res.json();
      
      if (data.user?.name) setAstrologerName(data.user.name);
      setTotalEarnings(data.totalEarnings || 0);
      setTodaysEarnings(data.todaysEarnings || 0);
      setBalance(data.balance || 0);
      setAvgRating(data.avgRating || 0);
      setReviews(data.reviews || []);
      
      const list = (data.chatSessions || []).map((s: any) => ({
        ...s,
        duration: s.duration ?? 0,
      }));
      setSessions(list);

      setProfile({
        bio: data.bio || "",
        speciality: data.speciality || "",
        languages: data.languages || "",
        ratePerMin: data.ratePerMin || 0,
        profileImage: data.profileImage || "",
      });
      setIsOnline(data.isOnline ?? false);

      // Update edit form if untouched
      if (!editProfile.ratePerMin) {
         setEditProfile({
           bio: data.bio || "",
           speciality: data.speciality || "",
           languages: data.languages || "",
           ratePerMin: data.ratePerMin || 0,
           profileImage: data.profileImage || "",
         });
      }
      
      const activeNow = list.filter((s: ChatSession) => s.status === "ACTIVE").length;
      if (previousActiveCount.current !== -1 && activeNow > previousActiveCount.current) {
        playChime();
      }
      previousActiveCount.current = activeNow;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [playChime, editProfile.ratePerMin, router]);

  useEffect(() => {
    fetchProfileData();
    const interval = setInterval(fetchProfileData, 5000);
    return () => clearInterval(interval);
  }, [fetchProfileData]);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/astrologer/withdrawals");
      if (res.ok) {
        const d = await res.json();
        setWithdrawals(d.withdrawals || []);
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (activeTab === "wallet") fetchWithdrawals();
  }, [activeTab, fetchWithdrawals]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount) return;
    try {
      const res = await fetch("/api/astrologer/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(withdrawAmount) }),
      });
      if (res.ok) {
        alert("Withdrawal requested successfully!");
        setWithdrawAmount("");
        fetchWithdrawals();
        fetchProfileData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to request withdrawal.");
      }
    } catch (e) {
      alert("Error occurred.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    let finalImageUrl = editProfile.profileImage;

    // Upload to Supabase if file exists
    if (editProfileImageFile) {
      const fileExt = editProfileImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, editProfileImageFile);
      if (uploadError) {
        alert("Image Upload Failed: " + uploadError.message);
        setIsUpdating(false);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      finalImageUrl = data.publicUrl;
    }

    try {
      const res = await fetch("/api/astrologer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editProfile, profileImage: finalImageUrl }),
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        setEditProfileImageFile(null); // clear file
        fetchProfileData();
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const joinChat = (sessionId: string) => {
    router.push(`/astrologer/chat/${sessionId}`);
  };

  const rejectChat = async (sessionId: string) => {
    if (!confirm("Cancel this incoming chat request? The user will not be charged.")) return;
    try {
      const res = await fetch("/api/chat/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        fetchProfileData(); // Refresh session list
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel session.");
      }
    } catch (e) {
      alert("Something went wrong.");
    }
  };

  const activeSessionsList = sessions.filter((s) => s.status === "ACTIVE");
  const pastSessionsList = sessions.filter((s) => s.status === "ENDED");

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  // Visual layout for stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-slate-300"}>★</span>
    ));
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 font-sans pb-20">
      {/* ─── HEADER ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_16px_rgba(245,200,66,0.08)] w-full">
        <div className="max-w-[1400px] mx-auto px-6 h-[70px] flex items-center justify-between gap-6">
          {/* ── Logo ── */}
          <div className="flex items-center gap-3 shrink-0 group cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-[52px] h-[52px] bg-[#ffce4b] rounded-full flex items-center justify-center border-2 border-[#f0c842]/60 shadow-md p-1 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800 opacity-80 animate-[spin_40s_linear_infinite]">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1"/>
                <path d="M50 4 L50 96 M4 50 L96 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.8"/>
                <text x="50" y="19" fontSize="9" textAnchor="middle" fill="currentColor">♈</text>
                <text x="81" y="54" fontSize="9" textAnchor="middle" fill="currentColor">♋</text>
                <text x="50" y="88" fontSize="9" textAnchor="middle" fill="currentColor">♎</text>
                <text x="19" y="54" fontSize="9" textAnchor="middle" fill="currentColor">♑</text>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-extrabold text-stone-900 tracking-tight group-hover:text-[#d97706] transition-colors">AstroWalla</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#d97706] font-bold mt-[3px]">Astrologer Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Online/Busy Toggle */}
            <button
              onClick={async () => {
                const newVal = !isOnline;
                setIsOnline(newVal);
                await fetch("/api/astrologer/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isOnline: newVal }),
                });
              }}
              className={`px-3 sm:px-4 py-2 rounded-[14px] text-xs font-extrabold flex items-center gap-2 border-[2px] transition-all hover:-translate-y-0.5
                ${isOnline ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 shadow-[0_4px_12px_rgba(52,211,153,0.1)]" : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 shadow-sm"}
              `}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`}></span>
              <span className="hidden sm:inline">{isOnline ? "Online" : "Offline / Busy"}</span>
              <span className="sm:hidden">{isOnline ? "Online" : "Busy"}</span>
            </button>

            {/* Profile Avatar + Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c842] to-[#FF9933] border-[2.5px] border-white shadow-lg flex items-center justify-center text-white font-extrabold text-base hover:scale-105 hover:shadow-xl transition-all"
                title="Profile"
              >
                {astrologerName[0].toUpperCase()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-[#fffbee] to-[#fff8e0] border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5c842] to-[#FF9933] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                        {astrologerName[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-stone-800 truncate">{astrologerName}</p>
                        <p className="text-[11px] text-[#d97706] font-semibold">Portal Access</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setActiveTab("settings"); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-[#d97706] transition-colors font-medium">
                      <span className="text-base">⚙️</span> Profile Settings
                    </button>
                    <div className="border-t border-stone-100 mt-1">
                      <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                        <span className="text-base">🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MAIN TABS ─── */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex space-x-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {["dashboard", "reviews", "wallet", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all rounded-t-xl
                ${activeTab === tab 
                  ? "bg-white text-[#d97706] border-t border-l border-r border-[#d97706]/30 shadow-[0_-4px_10px_rgba(217,119,6,0.05)]" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              {tab === "dashboard" ? "Dashboard & Queue" : tab === "reviews" ? "Feedback & Reviews" : tab === "wallet" ? "Wallet & Withdraw" : "Profile Settings"}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD TAB ─── */}
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: "📅", label: "Today's Net", value: `₹${todaysEarnings.toLocaleString()}`, sub: "Earned Today", color: "#10b981" },
                { icon: "💰", label: "Total Net", value: `₹${totalEarnings.toLocaleString()}`, sub: "All time", color: "#d97706" },
                { icon: "💬", label: "Consults", value: sessions.length, sub: "Lifetime sessions", color: "#8b5cf6" },
                { icon: "⭐", label: "Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", sub: `${reviews.length} reviews`, color: "#f5c842" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="text-3xl mb-3 drop-shadow-sm">{s.icon}</div>
                  <div className="font-cinzel text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-slate-700 text-[11px] font-black uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-slate-400 text-xs font-semibold">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Active Sessions Queue */}
            {activeSessionsList.length > 0 && (
              <div className="mb-12">
                <h2 className="font-cinzel text-2xl font-bold text-slate-800 mb-5 flex items-center gap-3 border-b border-emerald-100 pb-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                  Incoming Chat Requests
                  <span className="ml-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {activeSessionsList.length} Live
                  </span>
                </h2>
                <div className="space-y-4">
                  {activeSessionsList.map((s) => {
                    const elapsed = Math.floor((now - new Date(s.startedAt).getTime()) / 1000);
                    const remaining = Math.max(0, 1800 - elapsed); // 30-min window
                    const isExpiring = remaining < 120; // Less than 2 min left!
                    
                    return (
                      <div key={s.id} className={`flex flex-col md:flex-row md:items-center justify-between px-6 py-5 rounded-2xl bg-white shadow-[0_4px_20px_rgba(52,211,153,0.15)] border-l-4 ${isExpiring ? "border-l-red-400 animate-pulse" : "border-l-emerald-400"} transition-all`}>
                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-inner bg-slate-50 border border-slate-200 text-slate-400">
                            {(s.user?.name || "U")[0]}
                          </div>
                          <div>
                            <div className="text-slate-800 font-extrabold text-lg tracking-tight mb-1">{s.user?.name || "User"}</div>
                            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                              <span className="border border-slate-100 px-2 py-0.5 rounded-md bg-slate-50 text-slate-500">
                                {formatTime(s.startedAt)}
                              </span>
                              <span className={`border px-2 py-0.5 rounded-md ${isExpiring ? "bg-red-50 text-red-600 border-red-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                                Time left: {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => rejectChat(s.id)}
                            className="px-5 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest border-2 border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all"
                          >
                            ✕ Reject
                          </button>
                          <button onClick={() => joinChat(s.id)} className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 hover:shadow-emerald-500/40">
                            🔮 Join Chat Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session History */}
            <div>
              <h2 className="font-cinzel text-xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
                <span>Recent Consults</span>
              </h2>
              {loading ? (
                <div className="bg-white rounded-2xl py-20 flex items-center justify-center border border-slate-100 shadow-sm">
                  <VedicLoader size="sm" text="Loading astrological records..." />
                </div>
              ) : pastSessionsList.length === 0 ? (
                <div className="bg-white rounded-2xl py-24 text-center border border-slate-100 shadow-sm">
                  <div className="text-5xl mb-4 opacity-50 drop-shadow-sm">🌙</div>
                  <div className="text-slate-800 font-cinzel text-xl font-bold mb-2">The stars are quiet...</div>
                  <div className="text-slate-500 text-sm font-medium">You have no past consults yet. Leave your portal active to receive user chats.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastSessionsList.map((s) => (
                    <div key={s.id} className="bg-white flex items-center justify-between p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-[#d97706]/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-50 text-slate-500 border border-slate-200">{(s.user?.name || "U")[0]}</div>
                        <div>
                          <div className="text-slate-800 font-bold text-sm">{s.user?.name || "User"}</div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(s.startedAt)} at {formatTime(s.startedAt)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-500">+ ₹{s.totalCost?.toFixed(0) || 0}</div>
                        <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Earned</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── REVIEWS TAB ─── */}
        {activeTab === "reviews" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="font-cinzel text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-3">User Feedback</h2>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl py-24 text-center border border-slate-100 shadow-sm">
                <div className="text-5xl mb-4 opacity-50 drop-shadow-sm">⭐</div>
                <div className="text-slate-800 font-cinzel text-xl font-bold mb-2">No reviews yet</div>
                <div className="text-slate-500 text-sm font-medium">When users rate your sessions, their feedback will appear here.</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-slate-800">{r.reviewerName || r.user?.name || "Anonymous User"}</div>
                        <div className="text-xs text-slate-400 font-semibold">{formatDate(r.createdAt)}</div>
                      </div>
                      <div className="mb-3 flex text-sm">{renderStars(r.rating)}</div>
                      <div className="text-slate-600 text-sm italic">"{r.comment || "No comment provided."}"</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── WALLET & WITHDRAW TAB ─── */}
        {activeTab === "wallet" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            <h2 className="font-cinzel text-xl font-bold text-slate-800 border-b border-slate-200 pb-3">Wallet & Withdrawals</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Balance Card */}
              <div className="bg-white border border-stone-200 shadow-sm p-8 rounded-3xl relative overflow-hidden h-fit">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100 to-transparent pointer-events-none rounded-bl-full" />
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Available to Withdraw</div>
                <div className="text-5xl font-extrabold text-emerald-600 mb-6 drop-shadow-sm">₹{balance.toLocaleString()}</div>
                
                <form onSubmit={handleWithdraw} className="space-y-4 relative z-10 p-5 bg-[#faf8f5] rounded-2xl border border-stone-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#d97706] mb-2">Request Withdrawal</label>
                    <input type="number" min="500" max={balance} required value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min ₹500" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all font-mono" />
                  </div>
                  <button type="submit" disabled={balance < 500} className="w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold py-3 text-sm uppercase tracking-widest rounded-xl hover:shadow-md hover:shadow-amber-200/50 transition-all disabled:opacity-50">
                    Withdraw
                  </button>
                </form>
              </div>

              {/* History Table */}
              <div className="md:col-span-2 bg-white border border-stone-200 shadow-sm rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-100 bg-stone-50">
                  <h3 className="font-extrabold text-stone-800 text-sm uppercase tracking-widest">Withdrawal History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-stone-400 text-[10px] uppercase tracking-widest border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4 font-bold">Date & Time</th>
                        <th className="px-6 py-4 font-bold">Amount</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {withdrawals.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-stone-400 font-medium">No previous requests.</td></tr>
                      ) : (
                        withdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-stone-600 font-medium text-xs">
                              {new Date(w.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-6 py-4 font-extrabold text-stone-800">
                              ₹{w.amount}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                w.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                w.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              }`}>
                                {w.status}
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
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto">
              <h2 className="font-cinzel text-2xl font-bold text-slate-800 mb-2 items-center gap-2 flex">
                <span>⚙️</span> Profile Settings
              </h2>
              <p className="text-slate-500 text-sm mb-8">Update your portal details and pricing.</p>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Profile Avatar</label>
                  <div className="flex items-center gap-4">
                    {editProfile.profileImage && !editProfileImageFile && (
                       <img src={editProfile.profileImage} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                          if (e.target.files && e.target.files.length > 0) {
                              setEditProfileImageFile(e.target.files[0]);
                          }
                      }} 
                      className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#f5c842] file:text-slate-900 focus:ring-2 focus:ring-[#d97706]/50 cursor-pointer" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Specialties / Focus</label>
                  <input 
                    type="text" 
                    value={editProfile.speciality || ""} 
                    onChange={e => setEditProfile({...editProfile, speciality: e.target.value})}
                    placeholder="e.g. Love, Career, Vedic" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 focus:border-[#d97706] transition-all bg-slate-50 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1 font-semibold">Separate with commas to ensure users easily find your expertise.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Languages</label>
                  <input 
                    type="text" 
                    value={editProfile.languages || ""} 
                    onChange={e => setEditProfile({...editProfile, languages: e.target.value})}
                    placeholder="e.g. English, Hindi, Tamil" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 focus:border-[#d97706] transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Rate per Minute (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number"
                      min="1"
                      value={editProfile.ratePerMin || 0} 
                      onChange={e => setEditProfile({...editProfile, ratePerMin: parseInt(e.target.value) || 0})}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 focus:border-[#d97706] transition-all bg-slate-50 focus:bg-white font-mono font-bold text-lg"
                    />
                  </div>
                </div>


                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="w-full bg-slate-800 text-white font-bold text-sm uppercase tracking-widest py-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isUpdating ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
