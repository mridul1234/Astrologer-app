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
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_16px_rgba(245,200,66,0.08)]">
        <div className="max-w-[1400px] mx-auto px-6 h-[70px] flex items-center justify-between gap-6">

          {/* ── Logo ── */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
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
              <span className="text-[20px] font-extrabold text-stone-900 tracking-tight group-hover:text-[#d97706] transition-colors">CosmicInsight</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#d97706] font-bold mt-[3px]">Divine Astro Insight</span>
            </div>
          </Link>

          {/* ── Center Nav Links ── */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: "Free Kundli", href: "#" },
              { label: "Chat with Astrologer", href: "#" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="relative px-5 py-2 text-[15px] font-semibold text-stone-700 rounded-full hover:text-[#d97706] transition-colors group"
              >
                {label}
                <span className="absolute bottom-1 left-5 right-5 h-[2px] bg-[#f5c842] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
              </Link>
            ))}
          </div>

          {/* ── Right: Wallet + Profile ── */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Wallet Pill */}
            <button
              onClick={() => router.push("/wallet")}
              className="flex items-center gap-2.5 h-10 pl-3 pr-4 rounded-full border border-[#e9d9b0] bg-[#fffdf8] hover:bg-[#fff8e7] hover:border-[#f5c842] hover:shadow-md transition-all group"
            >
              {/* Wallet Icon */}
              <div className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-3.5 h-3.5 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v1H2V4zm0 3h16v9a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm11 2a1 1 0 100 2h1a1 1 0 100-2h-1z"/>
                </svg>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Wallet</span>
                <span className="text-[14px] font-extrabold text-stone-800">₹{balance.toFixed(0)}</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#FF9933] uppercase tracking-widest border-l border-[#f0e0b0] pl-2.5 ml-1 group-hover:text-[#d97706] transition-colors">Recharge</span>
            </button>

            {/* Profile Avatar + Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c842] to-[#FF9933] border-[2.5px] border-white shadow-lg flex items-center justify-center text-white font-extrabold text-base hover:scale-105 hover:shadow-xl transition-all"
                title={userName}
              >
                {userName[0].toUpperCase()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-[#fffbee] to-[#fff8e0] border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5c842] to-[#FF9933] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                        {userName[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-stone-800 truncate">{userName}</p>
                        <p className="text-[11px] text-[#d97706] font-semibold">⭐ Seeker Account</p>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="py-1">
                    {[
                      { icon: "👤", label: "My Profile", onClick: () => router.push("/profile") },
                      { icon: "💰", label: "Wallet & Recharge", onClick: () => router.push("/wallet") },
                      { icon: "📜", label: "Order History", onClick: () => router.push("/transactions") },
                    ].map(({ icon, label, onClick }) => (
                      <button key={label} onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-[#d97706] transition-colors font-medium">
                        <span className="text-base">{icon}</span> {label}
                      </button>
                    ))}
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

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10">
        
        {/* ── Section Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[#f5c842] text-xl">✦</span>
              <h1 className="text-[28px] font-extrabold text-stone-900 tracking-tight">Chat With Astrologer</h1>
              <span className="text-[#f5c842] text-xl">✦</span>
            </div>
          </div>
          <p className="text-stone-500 text-sm font-medium ml-8">Connect with verified astrologers and get guidance for your life&apos;s journey</p>
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-[#f0e6c8] shadow-sm p-3 flex flex-col sm:flex-row items-center gap-3 mb-8">

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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[13px] whitespace-nowrap transition-all duration-150 ${
                  category === label
                    ? "bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 shadow-sm shadow-amber-200/60"
                    : "bg-[#fdfaf5] border border-stone-200 text-stone-600 hover:border-[#f5c842]/50 hover:text-stone-800"
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
      <footer className="mt-auto" style={{ background: "linear-gradient(180deg, #fffdf8 0%, #fdf6e3 100%)", borderTop: "1px solid #f0e6c8" }}>
        {/* Main Footer Grid */}
        <div className="max-w-[1400px] mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Col 1: Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-md border-2 border-[#f0c842]/40 shrink-0 p-1 overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800 opacity-80 animate-[spin_40s_linear_infinite]">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <path d="M50 4 L50 96 M4 50 L96 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.8"/>
                    <text x="50" y="20" fontSize="10" textAnchor="middle" fill="currentColor">♈</text>
                    <text x="80" y="54" fontSize="10" textAnchor="middle" fill="currentColor">♋</text>
                    <text x="50" y="88" fontSize="10" textAnchor="middle" fill="currentColor">♎</text>
                    <text x="20" y="54" fontSize="10" textAnchor="middle" fill="currentColor">♑</text>
                  </svg>
                </div>
                <div>
                  <div className="font-extrabold text-2xl text-stone-900 tracking-tight leading-none">CosmicInsight</div>
                  <div className="text-[10px] uppercase tracking-widest text-[#d97706] font-bold mt-1">Divine Astro Insight</div>
                </div>
              </div>

              <p className="text-stone-600 text-sm leading-relaxed max-w-sm mb-6 font-medium">
                CosmicInsight is your trusted platform for authentic astrology consultations. Connect with verified astrologers and get guidance for all aspects of your life through chat, call, or video consultations.
              </p>

              {/* Social Icons */}
              <div className="flex gap-3 mb-6">
                {[
                  { icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z", label: "Facebook" },
                  { icon: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 20.5h9a5 5 0 005-5v-9a5 5 0 00-5-5h-9a5 5 0 00-5 5v9a5 5 0 005 5z", label: "Instagram" },
                  { icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z", label: "Twitter" },
                  { icon: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z", label: "YouTube" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#FF9933] hover:border-[#FF9933]/40 hover:shadow-md transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon}/>
                    </svg>
                  </button>
                ))}
              </div>

              <a href="mailto:support@cosmicinsight.in" className="flex items-center gap-2 text-stone-600 hover:text-[#FF9933] transition-colors text-sm font-semibold group">
                <svg className="w-4 h-4 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                support@cosmicinsight.in
              </a>
            </div>

            {/* Col 2: About Us */}
            <div>
              <h3 className="font-extrabold text-stone-900 text-base mb-5 tracking-tight relative">
                About Us
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f5c842] rounded-full block"></span>
              </h3>
              <ul className="space-y-3 mt-4">
                {["About Us", "Contact Us", "Product Details", "Careers", "Blog"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-stone-600 hover:text-[#FF9933] text-sm font-medium transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-[#f5c842] group-hover:w-3 transition-all duration-200 shrink-0"></span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Legal */}
            <div>
              <h3 className="font-extrabold text-stone-900 text-base mb-5 tracking-tight relative">
                Legal
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f5c842] rounded-full block"></span>
              </h3>
              <ul className="space-y-3 mt-4">
                {["Privacy Policy", "Terms & Conditions", "Refund & Cancellation", "Astrologer Login", "User Guidelines"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-stone-600 hover:text-[#FF9933] text-sm font-medium transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-[#f5c842] group-hover:w-3 transition-all duration-200 shrink-0"></span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: "1px solid #e9d9b0" }} className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-stone-400 font-semibold tracking-wide">
            © 2026 CosmicInsight. All Rights Reserved. Made with 🌟 in India.
          </span>
          <div className="flex items-center gap-2 text-xs text-stone-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </footer>

    </div>
  );
}

