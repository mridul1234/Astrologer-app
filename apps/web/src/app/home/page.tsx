"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ZODIAC_SIGNS = [
  { sign: "Aries", symbol: "♈", date: "Mar 21 – Apr 19", color: "#ef4444" },
  { sign: "Taurus", symbol: "♉", date: "Apr 20 – May 20", color: "#84cc16" },
  { sign: "Gemini", symbol: "♊", date: "May 21 – Jun 20", color: "#f59e0b" },
  { sign: "Cancer", symbol: "♋", date: "Jun 21 – Jul 22", color: "#3b82f6" },
  { sign: "Leo", symbol: "♌", date: "Jul 23 – Aug 22", color: "#f97316" },
  { sign: "Virgo", symbol: "♍", date: "Aug 23 – Sep 22", color: "#10b981" },
  { sign: "Libra", symbol: "♎", date: "Sep 23 – Oct 22", color: "#8b5cf6" },
  { sign: "Scorpio", symbol: "♏", date: "Oct 23 – Nov 21", color: "#dc2626" },
  { sign: "Sagittarius", symbol: "♐", date: "Nov 22 – Dec 21", color: "#7c3aed" },
  { sign: "Capricorn", symbol: "♑", date: "Dec 22 – Jan 19", color: "#64748b" },
  { sign: "Aquarius", symbol: "♒", date: "Jan 20 – Feb 18", color: "#0ea5e9" },
  { sign: "Pisces", symbol: "♓", date: "Feb 19 – Mar 20", color: "#6366f1" },
];

const BANNERS = [
  {
    id: 0,
    badge: "✦ First Consultation",
    title: "2 Free Minutes",
    subtitle: "With Every New Account",
    desc: "Start your cosmic journey — your first consultation is on us.",
    cta: "Chat Now",
    href: "/dashboard",
    gradient: "linear-gradient(135deg, #1a1040 0%, #2d1b69 60%, #4c1d95 100%)",
    accent: "#f5c842",
    image: "/banner-cosmic.png",
  },
  {
    id: 1,
    badge: "🔥 Most Popular",
    title: "Love & Relationships",
    subtitle: "Find Your Cosmic Match",
    desc: "Expert astrologers guide you through love, compatibility & marriage.",
    cta: "Explore",
    href: "/dashboard",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #c2410c 100%)",
    accent: "#fde68a",
    image: "/banner-love.png",
  },
  {
    id: 2,
    badge: "⚡ Instant Answers",
    title: "Career & Finance",
    subtitle: "Unlock Your Potential",
    desc: "Get clarity on career choices, business decisions & financial growth.",
    cta: "Ask Now",
    href: "/dashboard",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    accent: "#fef3c7",
    image: "/banner-career.png",
  },
];

const FEATURES = [
  { icon: "🔒", title: "100% Private", desc: "Your conversations are completely confidential" },
  { icon: "✅", title: "Verified Experts", desc: "All astrologers are background-checked & certified" },
  { icon: "⚡", title: "Instant Connect", desc: "Chat with an astrologer in under 60 seconds" },
  { icon: "💰", title: "Affordable Rates", desc: "Expert guidance starting from just ₹5/min" },
];

const SERVICES = [
  { icon: "💬", label: "Chat", href: "/dashboard", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "#f5c842" },
  { icon: "🪐", label: "Kundli", href: "/kundli", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", border: "#8b5cf6" },
  { icon: "💳", label: "Wallet", href: "/wallet", bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)", border: "#10b981" },
  { icon: "👤", label: "Profile", href: "/profile", bg: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "#ef4444" },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profile } = useSWR("/api/user/profile", fetcher);
  const { data: astrologers } = useSWR("/api/astrologers", fetcher, { refreshInterval: 60000 });

  const [bannerIdx, setBannerIdx] = useState(0);
  const [selectedZodiac, setSelectedZodiac] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const userName = profile?.name && profile.name.trim() !== "" ? profile.name : (session?.user?.name || session?.user?.email?.split("@")[0] || "Seeker");
  const balance = profile?.walletBalance !== undefined ? Number(profile.walletBalance).toFixed(0) : "—";
  const freeMinutes = profile?.freeMinutesLeft !== undefined ? Number(profile.freeMinutesLeft) : 0;

  const onlineAstrologers = Array.isArray(astrologers) ? astrologers.filter((a: { isOnline: boolean }) => a.isOnline).length : 0;

  // Auto-cycle banners
  useEffect(() => {
    const t = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setBannerIdx((i) => (i + 1) % BANNERS.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-slate-800 font-sans flex flex-col">
      <UserHeader />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-4 space-y-6">

        {/* ── Welcome Strip ── */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg,#1a1040,#2d1b69)", border: "1px solid rgba(245,200,66,0.3)" }}
        >
          <div>
            <p className="text-[#f5c842] text-xs font-bold uppercase tracking-widest">Welcome back</p>
            <p className="text-white font-extrabold text-lg leading-tight truncate max-w-[160px]">
              {userName} ✨
            </p>
          </div>
          <div className="flex gap-2">
            {freeMinutes > 0 && (
              <div className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/20">
                <span className="text-[#f5c842] font-black text-sm leading-none">{freeMinutes}</span>
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide">Free Min</span>
              </div>
            )}
            <div className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/20">
              <span className="text-[#4ade80] font-black text-sm leading-none">₹{balance}</span>
              <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide">Balance</span>
            </div>
            <div className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/20">
              <span className="text-white font-black text-sm leading-none">{onlineAstrologers}</span>
              <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide">Online</span>
            </div>
          </div>
        </div>

        {/* ── Hero Banner Carousel ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ minHeight: 190 }}>
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ background: banner.gradient, opacity: isTransitioning ? 0 : 1 }}
          />

          <div
            className="relative z-10 flex items-stretch"
            style={{ minHeight: 190, opacity: isTransitioning ? 0 : 1, transition: "opacity 0.3s" }}
          >
            {/* Text side */}
            <div className="flex-1 px-5 py-6 flex flex-col justify-between">
              <div>
                <span
                  className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                  style={{ background: "rgba(255,255,255,0.15)", color: banner.accent, border: `1px solid ${banner.accent}40` }}
                >
                  {banner.badge}
                </span>
                <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight">
                  {banner.title}
                </h2>
                <p className="font-bold mt-0.5" style={{ color: banner.accent, fontSize: 14 }}>
                  {banner.subtitle}
                </p>
                <p className="text-white/70 text-xs mt-1.5 max-w-[200px] leading-relaxed">
                  {banner.desc}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href={banner.href}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{ background: banner.accent, color: "#1a1040" }}
                >
                  {banner.cta} →
                </Link>
              </div>
            </div>

            {/* Image side */}
            <div className="relative shrink-0 w-[140px] sm:w-[180px] overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover object-left"
                style={{ opacity: 0.92, mixBlendMode: "luminosity" }}
              />
              {/* Fade edge to blend with gradient */}
              <div className="absolute inset-y-0 left-0 w-10"
                style={{ background: `linear-gradient(to right, ${banner.gradient.match(/#[a-f0-9]{6}/i)?.[0] ?? "#1a1040"}, transparent)` }}
              />
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIsTransitioning(true); setTimeout(() => { setBannerIdx(i); setIsTransitioning(false); }, 300); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === bannerIdx ? 20 : 6,
                  height: 6,
                  background: i === bannerIdx ? banner.accent : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Quick Services Grid ── */}
        <div>
          <h2 className="text-stone-800 font-black text-base mb-3 flex items-center gap-2">
            <span className="text-[#f5c842]">✦</span> Quick Access
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            {SERVICES.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
                style={{ background: s.bg, border: `1px solid ${s.border}40` }}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[11px] font-extrabold text-stone-700 uppercase tracking-wide">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Daily Horoscope Teaser ── */}
        <div
          className="rounded-3xl p-4 sm:p-5"
          style={{ background: "linear-gradient(135deg,#fff9ed,#fef3c7)", border: "1px solid #f5c84260" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-stone-800 text-base flex items-center gap-2">
                <span className="text-[#f5c842]">🌙</span> Your Zodiac
              </h2>
              <p className="text-stone-500 text-xs">Pick your sign for today&apos;s insight</p>
            </div>
            <Link href="/dashboard" className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest hover:text-amber-700">
              Ask Astrologer →
            </Link>
          </div>

          {/* Scrollable zodiac row */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {ZODIAC_SIGNS.map((z, i) => (
              <button
                key={z.sign}
                onClick={() => setSelectedZodiac(i === selectedZodiac ? null : i)}
                className="flex flex-col items-center gap-1 shrink-0 p-2.5 rounded-2xl transition-all duration-200"
                style={{
                  background: selectedZodiac === i ? z.color : "white",
                  border: `1.5px solid ${selectedZodiac === i ? z.color : "#f0e6c8"}`,
                  transform: selectedZodiac === i ? "scale(1.05)" : "scale(1)",
                  minWidth: 52,
                }}
              >
                <span className="text-xl">{z.symbol}</span>
                <span
                  className="text-[9px] font-extrabold uppercase tracking-wide"
                  style={{ color: selectedZodiac === i ? "white" : "#78716c" }}
                >
                  {z.sign}
                </span>
              </button>
            ))}
          </div>

          {selectedZodiac !== null && (
            <div
              className="mt-3 p-3 rounded-2xl flex items-start gap-3 animate-slide-up"
              style={{ background: "white", border: `1px solid ${ZODIAC_SIGNS[selectedZodiac].color}30` }}
            >
              <span className="text-2xl">{ZODIAC_SIGNS[selectedZodiac].symbol}</span>
              <div className="flex-1">
                <p className="font-extrabold text-stone-800 text-sm">{ZODIAC_SIGNS[selectedZodiac].sign}</p>
                <p className="text-stone-400 text-[10px]">{ZODIAC_SIGNS[selectedZodiac].date}</p>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  The stars align in your favour today. Focus on relationships and inner clarity.
                  A meaningful conversation awaits — trust your intuition. ✨
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block mt-2 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg"
                  style={{ background: ZODIAC_SIGNS[selectedZodiac].color, color: "white" }}
                >
                  Get Full Reading →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Promo Banner: Free Trial ── */}
        {freeMinutes > 0 && (
          <div
            className="rounded-3xl p-4 sm:p-5 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg,#022c22,#064e3b)", border: "1px solid #10b98140" }}
          >
            <div className="text-4xl">🎁</div>
            <div className="flex-1">
              <p className="text-[#4ade80] text-[11px] font-extrabold uppercase tracking-widest">Special Offer</p>
              <p className="text-white font-black text-base leading-tight">You have {freeMinutes} free {freeMinutes === 1 ? "minute" : "minutes"}!</p>
              <p className="text-white/60 text-xs mt-0.5">Use them to talk to any astrologer right now.</p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 px-4 py-2 rounded-xl font-extrabold text-sm transition-all hover:scale-105"
              style={{ background: "#4ade80", color: "#022c22" }}
            >
              Use Now
            </Link>
          </div>
        )}

        {/* ── Why AstroWalla ── */}
        <div>
          <h2 className="text-stone-800 font-black text-base mb-3 flex items-center gap-2">
            <span className="text-[#f5c842]">✦</span> Why AstroWalla?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: "1px solid #f0e6c8" }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="font-extrabold text-stone-800 text-sm">{f.title}</p>
                <p className="text-stone-500 text-[11px] leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonial ── */}
        <div
          className="rounded-3xl p-4 sm:p-5"
          style={{ background: "linear-gradient(135deg,#fdf4ff,#fae8ff)", border: "1px solid #d8b4fe40" }}
        >
          <h2 className="text-stone-800 font-black text-base mb-3 flex items-center gap-2">
            <span>🌸</span> What Seekers Say
          </h2>
          <div className="space-y-3">
            {[
              { name: "Priya S.", text: "Incredibly accurate! The astrologer predicted my job change 3 months in advance. Blown away! ⭐⭐⭐⭐⭐" },
              { name: "Rahul M.", text: "Very easy to use and affordable. The free trial convinced me. Now I consult weekly! ⭐⭐⭐⭐⭐" },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-3.5" style={{ border: "1px solid #e9d5ff40" }}>
                <p className="text-stone-600 text-xs leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="text-stone-400 text-[10px] font-extrabold uppercase tracking-widest mt-2">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div
          className="rounded-3xl p-5 text-center"
          style={{ background: "linear-gradient(135deg,#1a1040,#2d1b69,#4c1d95)", border: "1px solid #7c3aed40" }}
        >
          <p className="text-[#f5c842] text-xs font-extrabold uppercase tracking-widest mb-1">Your Destiny Awaits</p>
          <h2 className="text-white font-black text-xl mb-1.5">Talk to an Astrologer</h2>
          <p className="text-white/60 text-xs mb-4 max-w-xs mx-auto">
            Get personalised cosmic guidance on love, career, health & more — right now.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg,#f5c842,#FF9933)", color: "#1a1040" }}
          >
            ✦ Connect Now ✦
          </Link>
        </div>

        <div className="h-2" />
      </main>

      <MobileBottomNav />
      <UserFooter />
    </div>
  );
}
