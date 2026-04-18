"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import VedicLoader from "@/components/VedicLoader";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Astrologer {
  id: string;
  speciality: string | null;
  ratePerMin: number;
  isOnline: boolean;
  isBusy: boolean;
  sessionStartedAt: string | null;
  bio: string | null;
  user: { name: string };
  averageRating: number;
  reviewCount: number;
  orderCount: number;
  experienceYears?: number;
  languages?: string;
  categories?: string[];
  profileImage?: string | null;
}

export default function UserDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: apiAstrologers, isLoading: loadingAstrologers } = useSWR("/api/astrologers", fetcher, { 
    refreshInterval: 30000,
    revalidateOnFocus: true 
  });
  
  const { data: profile } = useSWR("/api/user/profile", fetcher);
  
  const astrologers = apiAstrologers ? [...apiAstrologers].sort((a: Astrologer, b: Astrologer) => b.reviewCount - a.reviewCount) : [];
  
  const balance = profile?.walletBalance !== undefined ? Number(profile.walletBalance) : 0;
  const freeMinutesLeft = profile?.freeMinutesLeft !== undefined ? Number(profile.freeMinutesLeft) : 0;
  const balanceLoaded = profile !== undefined;

  const [starting, setStarting] = useState<string | null>(null);
  
  // New UI states
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Use the name saved in profile (from onboarding), or fall back to session
  const userName = profile?.name && profile.name.trim() !== "" ? profile.name : (session?.user?.name || session?.user?.email?.split("@")[0] || "User");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside for dropdown
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categories = ["All", "Love", "Education", "Career", "Marriage"];

  const getCategories = (a: Astrologer) => {
    if (a.categories && a.categories.length > 0) return a.categories;
    // Fallback pseudo-categories based on ID to ensure the cards always have categories
    const seed = a.id.charCodeAt(0) + a.id.charCodeAt(a.id.length - 1);
    const available = ["Love", "Education", "Career", "Marriage"];
    return [available[seed % available.length], available[(seed + 1) % available.length]];
  };

  const displayedAstrologers = astrologers.filter((a) => {
    const matchesSearch = a.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cats = getCategories(a);
    const matchesCategory = category === "All" || cats.some(c => c.toLowerCase() === category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  async function startChat(astrologerId: string, rate: number) {
    // Only do front-end balance guard if we've successfully loaded the balance
    // Allow users to start a chat if they have free minutes, even if wallet balance is low
    if (balanceLoaded && balance < rate && freeMinutesLeft <= 0) {
      router.push("/wallet");
      return;
    }
    setStarting(astrologerId);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ astrologerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) router.push("/wallet"); 
        setStarting(null);
        return;
      }
      router.push(`/dashboard/chat/${data.sessionId}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      setStarting(null);
    }
  }

  // Derive a deterministic experience years from id (still mock - no real DB field for this yet)
  const getExpYears = (id: string) => {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return (seed % 15) + 1;
  };

  // Generate star display from averageRating (0-5)
  const getStars = (avg: number) => {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
  };

  // Derive a fake original (crossed-out) rate from actual rate
  const getOriginalRate = (rate: number) => Math.floor(rate * 1.5);

  // Estimate wait time from session start (assume avg session is 15 min)
  const getWaitMins = (sessionStartedAt: string | null): number => {
    if (!sessionStartedAt) return 5;
    const elapsed = (Date.now() - new Date(sessionStartedAt).getTime()) / 60000;
    const remaining = Math.max(2, Math.round(15 - elapsed));
    return remaining;
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-slate-800 font-sans flex flex-col">
      <UserHeader />

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5">
        
        {/* ── Section Header ── */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#f5c842] text-lg">✦</span>
            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-stone-900 tracking-tight">Chat With Astrologer</h1>
            <span className="text-[#f5c842] text-lg">✦</span>
          </div>
          <p className="text-stone-500 text-sm font-medium ml-6 sm:ml-8">Connect with verified astrologers and get guidance for your life&apos;s journey</p>
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-[#f0e6c8] shadow-sm p-2.5 sm:p-3 flex flex-col gap-2.5 mb-6">

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-[#f5c842] flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search astrologer by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:bg-white focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all text-sm font-medium placeholder:text-stone-400 text-stone-800"
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-stone-200 shrink-0" />

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
            {[
              { label: "All", icon: "✦", color: "text-amber-700" },
              { label: "Love", icon: "❤️", color: "" },
              { label: "Education", icon: "🎓", color: "" },
              { label: "Career", icon: "💼", color: "" },
              { label: "Marriage", icon: "💍", color: "" },
            ].map(({ label, icon, color }) => (
              <button
                key={label}
                onClick={() => setCategory(label)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[13px] whitespace-nowrap transition-all duration-200 ease-out ${
                  category === label
                    ? "bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 shadow-md shadow-amber-200/60 scale-105"
                    : "bg-[#fdfaf5] border border-stone-200 text-stone-600 hover:bg-[#fff9ea] hover:border-[#f5c842] hover:text-[#d97706] hover:shadow-md hover:-translate-y-1"
                }`}
              >
                <span className={color}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

        </div>

        {/* Astrologer Cards Grid */}
        {loadingAstrologers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 relative flex gap-4 border border-stone-100 shadow-[0_4px_15px_rgba(0,0,0,0.04)] animate-pulse">
                {/* Left Column Avatar */}
                <div className="flex flex-col items-center shrink-0 w-24">
                  <div className="w-20 h-20 rounded-full bg-stone-200 mb-2"></div>
                  <div className="h-3 w-12 bg-stone-200 rounded mt-1"></div>
                  <div className="h-2 w-10 bg-stone-200 rounded mt-2"></div>
                </div>
                {/* Right Column Details */}
                <div className="flex-1 flex flex-col pt-1">
                  <div className="flex items-start justify-between">
                    <div className="h-5 w-24 bg-stone-200 rounded"></div>
                    <div className="h-5 w-5 bg-stone-200 rounded-full"></div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="h-4 w-12 bg-amber-50 rounded"></div>
                    <div className="h-4 w-16 bg-amber-50 rounded"></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-32 bg-stone-200 rounded"></div>
                    <div className="h-3 w-28 bg-stone-200 rounded"></div>
                  </div>
                  <div className="mt-auto pt-6 flex flex-col gap-3">
                    <div className="h-5 w-20 bg-stone-200 rounded"></div>
                    <div className="h-10 w-full bg-stone-100 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedAstrologers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-stone-100 shadow-sm">
            <div className="text-5xl mb-4 opacity-50 drop-shadow-sm">🪷</div>
            <p className="text-slate-500 font-bold text-lg mb-1">No astrologers found.</p>
            <p className="text-slate-400 text-sm font-medium">Please adjust your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedAstrologers.map((a) => {
              const exp = a.experienceYears ?? getExpYears(a.id);
              const originalRate = getOriginalRate(a.ratePerMin);
              const stars = getStars(a.averageRating);
              
              return (
                <div
                  key={a.id}
                  onClick={() => router.push(`/astrologer/${a.id}`)}
                  className="bg-white rounded-3xl p-5 relative flex gap-4 border border-stone-100 shadow-[0_4px_15px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,200,66,0.18)] hover:-translate-y-1.5 hover:border-[#f5c842]/40 transition-all duration-300 cursor-pointer group"
                >


                  {/* Left Column: Avatar & Rating */}
                  <div className="flex flex-col items-center shrink-0 w-24">
                    <div className="w-20 h-20 rounded-full border-[3px] border-[#f5c842] p-1 mb-2 relative group-hover:border-[#d97706] group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-amber-200/60 group-hover:shadow-lg">
                      <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl overflow-hidden">
                        {a.profileImage
                          ? <img src={a.profileImage} alt={a.user.name} className="w-full h-full object-cover rounded-full" />
                          : <span className="text-3xl">👨🏽‍🦱</span>
                        }
                      </div>
                    </div>
                    {/* Stars + Rating */}
                    <div className="flex items-center gap-1 text-[#16a34a] text-base font-bold leading-none">
                      {a.averageRating > 0 ? stars : "☆☆☆☆☆"}
                    </div>
                    <div className="text-[10px] text-stone-500 font-semibold mt-0.5">
                      {a.averageRating > 0 ? `${a.averageRating.toFixed(1)} · ` : ""}{a.orderCount} orders
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-1 flex flex-col pt-1">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight leading-none">{a.user.name}</h2>
                        <div className="flex flex-wrap gap-1 mt-1.5 mb-1">
                          {getCategories(a).map(c => (
                            <span key={c} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded-md border border-amber-200/50">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Verified Badge */}
                      <svg className="w-5 h-5 text-[#84cc16] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>

                    <div className="text-sm text-stone-500 font-medium mt-1 leading-snug space-y-0.5">
                      <p className="truncate text-stone-600 italic">{a.speciality ?? "Vedic Astrology Expert"}</p>
                      <p>Hindi, English.</p>
                      <p>Experience: {exp} Years</p>
                    </div>

                    {/* Price + Action Row */}
                    <div className="mt-auto pt-3 space-y-2">

                      {/* Price row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-500 font-bold text-sm line-through decoration-red-500/50">₹ {originalRate}</span>
                          <span className="font-extrabold text-lg text-black">
                            <span className="text-[#16a34a]">₹ {a.ratePerMin}</span>
                            <span className="text-xs text-stone-500 font-bold">/min</span>
                          </span>
                        </div>

                        {/* Status badge - Only show if Busy or Offline */}
                        {a.isBusy ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">In Session</span>
                          </div>
                        ) : !a.isOnline && (
                          <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-2.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">Not Available</span>
                          </div>
                        )}
                      </div>

                      {/* Action button row */}
                      {a.isBusy ? (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            disabled
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-5 py-2 rounded-xl text-sm font-bold border-2 border-orange-300 text-orange-400 bg-orange-50 cursor-not-allowed opacity-80"
                          >
                            🔴 Busy
                          </button>
                          <div className="text-right">
                            <p className="text-[11px] text-stone-400 font-medium leading-tight">Est. wait</p>
                            <p className="text-sm font-extrabold text-orange-500">~{getWaitMins(a.sessionStartedAt)} min</p>
                          </div>
                        </div>
                      ) : !a.isOnline ? (
                        <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-5 py-2 rounded-xl text-sm font-bold border-2 border-stone-200 text-stone-400 bg-stone-50 cursor-not-allowed opacity-80"
                        >
                          Not Available
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startChat(a.id, a.ratePerMin);
                          }}
                          disabled={!!starting}
                          className="w-full px-5 py-2 rounded-xl text-sm font-bold border-2 border-[#16a34a] text-[#16a34a] bg-transparent hover:bg-[#16a34a] hover:text-white hover:shadow-lg hover:shadow-green-200/60 hover:scale-105 active:scale-100 transition-all duration-200 disabled:opacity-50"
                        >
                          {starting === a.id ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                              Starting...
                            </span>
                          ) : ((a.ratePerMin === 0 || freeMinutesLeft > 0) ? "💬 Free Chat" : "💬 Chat Now")}
                        </button>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      <MobileBottomNav />
      <UserFooter />

    </div>
  );
}


