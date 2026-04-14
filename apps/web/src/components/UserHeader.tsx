"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const { data: profile, isLoading } = useSWR("/api/user/profile", fetcher);
  const balance = profile?.walletBalance !== undefined ? Number(profile.walletBalance) : 0;
  const freeMinutesLeft: number = profile?.freeMinutesLeft ?? 0;
  const isLoadingBalance = isLoading;

  const userName = profile?.name && profile.name.trim() !== "" ? profile.name : (session?.user?.name || session?.user?.email?.split("@")[0] || "User");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

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

  return (
    <nav className="sticky top-0 z-50 w-full" style={{ background: "white", borderBottom: "1px solid #f0e6c8", boxShadow: "0 2px 16px rgba(245,200,66,0.08)" }}>
      {/* Navy brand identity bar — same as landing page & login */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, #1a1040 0%, #2d1b69 40%, #FF9933 70%, #f5c842 100%)" }} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-3 sm:gap-6">
        {/* ── Logo ── */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] bg-[#ffce4b] rounded-full flex items-center justify-center border-2 border-[#f0c842]/60 shadow-md p-1 overflow-hidden">
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
            <span className="text-[17px] sm:text-[20px] font-extrabold text-stone-900 tracking-tight group-hover:text-[#d97706] transition-colors">AstroWalla</span>
            <span className="hidden sm:block text-[9px] uppercase tracking-[0.18em] text-[#d97706] font-bold mt-[3px]">Your Celestial Guide</span>
          </div>
        </Link>

        {/* ── Center Nav Links ── */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { label: "Free Kundli", href: "/kundli" },
            { label: "Chat with Astrologer", href: "/dashboard" },
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
            className="flex items-center gap-1.5 sm:gap-2.5 h-9 sm:h-10 pl-2.5 sm:pl-3 pr-2.5 sm:pr-4 rounded-full border border-[#e9d9b0] bg-[#fffdf8] hover:bg-[#fff8e7] hover:border-[#f5c842] hover:shadow-md transition-all group"
          >
            {/* Wallet Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#f5c842] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v1H2V4zm0 3h16v9a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm11 2a1 1 0 100 2h1a1 1 0 100-2h-1z"/>
              </svg>
            </div>
            <div className="flex flex-col items-start leading-none">
              {freeMinutesLeft > 0 ? (
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Free Trial</span>
              ) : (
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Wallet</span>
              )}
              {isLoadingBalance ? (
                <div className="h-3.5 w-8 mt-0.5 bg-stone-200 animate-pulse rounded"></div>
              ) : freeMinutesLeft > 0 ? (
                <span className="text-[12px] sm:text-[13px] font-extrabold text-emerald-600">🎁 {freeMinutesLeft} min free</span>
              ) : (
                <span className="text-[13px] sm:text-[14px] font-extrabold text-stone-800">₹{balance.toFixed(0)}</span>
              )}
            </div>
            <span className="hidden sm:block text-[10px] font-extrabold text-[#FF9933] uppercase tracking-widest border-l border-[#f0e0b0] pl-2.5 ml-1 group-hover:text-[#d97706] transition-colors">
              {freeMinutesLeft > 0 ? "Try Now" : "Recharge"}
            </span>
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
                      <p className="text-[11px] text-[#d97706] font-semibold">My Account</p>
                    </div>
                  </div>
                </div>
                {/* Menu Items */}
                <div className="py-1">
                  {[
                     { icon: "💰", label: "Wallet Transactions", onClick: () => router.push("/transactions") },
                     { icon: "📜", label: "Order History", onClick: () => router.push("/orders") },
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
  );
}
