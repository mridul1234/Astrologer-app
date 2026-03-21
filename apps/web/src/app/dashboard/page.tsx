"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface Astrologer {
  id: string;
  speciality: string | null;
  ratePerMin: number;
  isOnline: boolean;
  bio: string | null;
  user: { name: string };
  averageRating: number;
  reviewCount: number;
}

export default function UserDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [loadingAstrologers, setLoadingAstrologers] = useState(true);
  const [balance, setBalance] = useState(0);
  const [starting, setStarting] = useState<string | null>(null);
  
  // New UI states
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");

  const userName = session?.user?.name ?? "Seeker";
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/astrologers")
      .then((r) => r.json())
      .then((data) => {
        // Sort by review count
        const sorted = data.sort((a: Astrologer, b: Astrologer) => b.reviewCount - a.reviewCount);
        setAstrologers(sorted);
        setLoadingAstrologers(false);
      })
      .catch(() => setLoadingAstrologers(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((p) => { if (p?.walletBalance !== undefined) setBalance(p.walletBalance); })
      .catch(() => {});

    // Click outside for dropdown
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = ["All", "Love", "Education", "Career", "Marriage"];

  const displayedAstrologers = astrologers.filter((a) => {
    const matchesSearch = a.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "All" || (a.speciality ?? "love education career marriage").toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  async function startChat(astrologerId: string, rate: number) {
    if (balance < rate) {
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

  // Helper for deterministic mocked data based on ID
  const getMockData = (id: string, rate: number, reviews: number) => {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    const exp = (seed % 15) + 1;
    const originalRate = Math.floor(rate * 1.5);
    const orders = reviews === 0 ? (seed % 200) + 15 : reviews * 12 + (seed % 50);
    return { exp, originalRate, orders };
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-slate-800 font-sans flex flex-col">
      {/* ─── NAVBAR ─── */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto">
          {/* Top Row */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-stone-100">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#ffce4b] rounded-full flex items-center justify-center p-1 relative overflow-hidden">
                {/* Zodiac wheel mock SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800 opacity-60 animate-[spin_40s_linear_infinite]">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" stroke="currentColor" strokeWidth="0.5" />
                  <text x="50" y="20" fontSize="8" textAnchor="middle" fill="currentColor">♈</text>
                  <text x="80" y="50" fontSize="8" textAnchor="middle" fill="currentColor">♋</text>
                  <text x="50" y="85" fontSize="8" textAnchor="middle" fill="currentColor">♎</text>
                  <text x="20" y="50" fontSize="8" textAnchor="middle" fill="currentColor">♑</text>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-none text-black tracking-tight">CosmicInsight</span>
                <span className="text-[9px] uppercase tracking-widest text-[#d97706] font-semibold mt-0.5">Divine Astro Insight</span>
              </div>
            </div>

            {/* Desktop Center Links */}
            <div className="hidden lg:flex items-center gap-6 font-semibold text-slate-600 text-[15px]">
              <Link href="#" className="hover:text-[#FF9933] transition-colors flex items-center gap-2">
                 <span>✨</span> Free Kundli
              </Link>
            </div>

            {/* Right Side: Language, Wallet, Profile */}
            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-1 bg-[#fff8ed] text-stone-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-orange-100 hover:bg-orange-50">
                English
                <svg className="w-3 h-3 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>
              
              <button
                onClick={() => router.push("/wallet")}
                className="flex items-center gap-2 bg-[#fef8f0] px-4 py-1.5 rounded-full border border-orange-100 shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-xl">👛</span>
                <span className="font-bold text-stone-800 text-sm">Wallet <span className="text-black">₹ {balance.toFixed(0)}</span></span>
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-full bg-slate-200 border-2 border-[#e2e8f0] overflow-hidden flex items-center justify-center hover:border-slate-300 transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </button>
                
                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                      <p className="text-xs text-slate-500 truncate">Seeker Account</p>
                    </div>
                    <button onClick={() => router.push("/profile")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-[#FF9933] transition-colors flex items-center gap-2">
                       <span>👤</span> My Profile
                    </button>
                    <button onClick={() => router.push("/transactions")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-[#FF9933] transition-colors flex items-center gap-2">
                      <span>📜</span> Order History
                    </button>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 mt-1 border-t border-slate-50">
                      <span>🚪</span> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="hidden lg:flex items-center justify-center gap-8 py-3 text-[#4b5563] font-bold text-[15px]">
            <Link href="#" className="hover:text-[#FF9933] flex items-center gap-2">
               <span className="text-xl">🕉️</span> Chat with Astrologer
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10">
        
        {/* Search & Filter Pill Container */}
        <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 p-2 md:p-3 flex flex-col xl:flex-row items-center justify-between gap-4 mb-10 w-full mx-auto">
          
          <div className="flex items-center gap-4 w-full xl:w-auto ml-2">
            <div className="w-3 h-3 rounded-full bg-[#f5c842] shadow-[0_0_8px_#f5c842]" />
            <h1 className="text-2xl font-cinzel font-bold text-stone-800 whitespace-nowrap">Chat With Astrologer</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:ml-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-[#f5c842] flex items-center justify-center text-white p-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="Search Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-3 rounded-full border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition-all text-sm font-medium placeholder:text-stone-400"
              />
            </div>

            {/* Filter Button */}
            <button className="flex items-center gap-2 border border-stone-200 rounded-full px-5 py-3 hover:bg-stone-50 transition-colors bg-white font-semibold text-sm text-stone-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filter
            </button>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 border px-6 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                    category === cat 
                    ? "bg-[#ffce4b] border-[#eab308] text-stone-900 shadow-sm"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {i === 0 && <span className="text-white drop-shadow-sm">⌘</span>}
                  {i === 1 && <span>❤️</span>}
                  {i === 2 && <span>🎓</span>}
                  {i === 3 && <span>💼</span>}
                  {i === 4 && <span>💍</span>}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Astrologer Cards Grid */}
        {loadingAstrologers ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative w-24 h-24 text-[#FF9933] animate-[spin_10s_linear_infinite]">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5"/>
                 <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1"/>
                 <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                 <polygon points="50,15 60,35 80,40 65,55 70,75 50,65 30,75 35,55 20,40 40,35" fill="currentColor" opacity="0.8"/>
              </svg>
            </div>
            <div className="text-stone-500 font-bold uppercase tracking-widest text-sm animate-pulse">Aligning the Starts...</div>
          </div>
        ) : displayedAstrologers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-stone-100 shadow-sm">
            <div className="text-5xl mb-4 opacity-50 drop-shadow-sm">🪷</div>
            <p className="text-slate-500 font-bold text-lg mb-1">No astrologers found.</p>
            <p className="text-slate-400 text-sm font-medium">Please adjust your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedAstrologers.map((a, index) => {
              const { exp, originalRate, orders } = getMockData(a.id, a.ratePerMin, a.reviewCount);
              
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-3xl p-5 relative flex gap-4 border border-stone-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,153,51,0.12)] transition-all duration-300 group"
                >
                  {/* Top Choice Ribbon for the first few */}
                  {index < 2 && (
                    <div className="absolute top-0 left-0 overflow-hidden w-20 h-20 rounded-tl-3xl z-10">
                      <div className="absolute top-4 -left-7 bg-[#2e2e2e] text-[#f5c842] text-[9px] font-bold uppercase tracking-widest py-1 w-32 text-center -rotate-45 shadow-sm">
                        Top Choice
                      </div>
                    </div>
                  )}

                  {/* Left Column: Avatar & Rating */}
                  <div className="flex flex-col items-center shrink-0 w-24">
                    <div className="w-20 h-20 rounded-full border-[3px] border-[#f5c842] p-1 mb-2 relative">
                      <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl overflow-hidden object-cover bg-gradient-to-b from-[#fef3c7] to-[#fde68a]">
                        👨🏽‍🦱
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex text-[#16a34a] text-xs gap-[1px]">
                       ★★★★★
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium mt-1">
                      {orders} orders
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-1 flex flex-col pt-1">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight">{a.user.name}</h2>
                      {/* Verified Badge */}
                      <svg className="w-5 h-5 text-[#84cc16]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>

                    <div className="text-sm text-stone-500 font-medium mt-1 leading-snug space-y-0.5">
                      <p className="truncate text-stone-600">{a.speciality ?? "Vedic, KP, Nadi"}</p>
                      <p>Hindi, English.</p>
                      <p>Experience: {exp} Years</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-500 font-bold text-sm line-through decoration-red-500/50">₹ {originalRate}</span>
                        <span className="font-extrabold text-lg text-black">
                          <span className="text-[#16a34a]">₹ {a.ratePerMin}</span>
                          <span className="text-xs text-stone-500 font-bold">/min</span>
                        </span>
                      </div>
                      <button
                        onClick={() => startChat(a.id, a.ratePerMin)}
                        disabled={!!starting}
                        className="px-5 py-2 rounded-xl text-sm font-bold border border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a]/5 bg-transparent"
                      >
                         {starting === a.id ? "..." : (a.ratePerMin === 0 ? "Free Chat" : "Chat")}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-stone-200 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center p-1 text-amber-800">
               <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                 <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
                 <path d="M50 2 L50 98 M2 50 L98 50" stroke="currentColor" strokeWidth="1" />
               </svg>
            </div>
            <div>
              <div className="font-extrabold text-stone-800 text-xl tracking-tight">CosmicInsight</div>
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-0.5">© 2026 Astronomy Global. All Rights Reserved.</div>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-stone-500">
             <Link href="#" className="hover:text-[#FF9933] transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-[#FF9933] transition-colors">Terms of Service</Link>
             <Link href="#" className="hover:text-[#FF9933] transition-colors">Support</Link>
             <Link href="#" className="hover:text-[#FF9933] transition-colors">Astrologer Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

