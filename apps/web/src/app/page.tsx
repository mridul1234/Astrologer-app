"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Astrologer {
  id: string;
  speciality: string | null;
  ratePerMin: number;
  isOnline: boolean;
  isBusy: boolean;
  user: { name: string };
  averageRating: number;
  reviewCount: number;
  orderCount: number;
  experienceYears?: number;
  languages?: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "💬", title: "Chat Consultation", desc: "Live, private chat with verified astrologers anytime." },
  { icon: "🔮", title: "Free Kundli", desc: "Personalized Vedic birth chart — accurate & instant." },
  { icon: "❤️", title: "Love & Relationships", desc: "Clarity on marriage, compatibility & love life." },
  { icon: "💼", title: "Career Guidance", desc: "Career switches, business timing & financial growth." },
  { icon: "🏥", title: "Health Astrology", desc: "Planetary impact on health & wellbeing insights." },
  { icon: "🌟", title: "Daily Horoscope", desc: "Personalised daily cosmic guidance for your sign." },
];

const TESTIMONIALS = [
  { name: "Priya S.", city: "Mumbai", sign: "♏ Scorpio", text: "The career guidance was unnervingly accurate. I landed my dream job exactly when predicted.", rating: 5 },
  { name: "Rahul M.", city: "Bangalore", sign: "♈ Aries", text: "After my relationship reading, I got clarity I hadn't found in years of therapy. Truly remarkable.", rating: 5 },
  { name: "Ananya K.", city: "Delhi", sign: "♋ Cancer", text: "The Kundali analysis felt so personal — like she already knew my entire life. Referred 6 friends!", rating: 5 },
  { name: "Vikram T.", city: "Pune", sign: "♑ Capricorn", text: "Connected at midnight during a business panic. Every date the astrologer predicted came true.", rating: 5 },
  { name: "Sneha R.", city: "Chennai", sign: "♍ Virgo", text: "Booked a 10-minute session, stayed 45 minutes. The health insights were spot on.", rating: 5 },
  { name: "Arjun P.", city: "Hyderabad", sign: "♒ Aquarius", text: "Best ₹200 I ever spent. Predicted my promotion to the exact week. A regular user now!", rating: 5 },
];

const FAQS = [
  { q: "How does the chat session work?", a: "After adding funds, pick any available astrologer and click 'Chat Now'. You're connected in real-time within seconds. The session is charged per minute — only when the astrologer has joined and you're actively chatting." },
  { q: "What is the minimum recharge amount?", a: "You can add as little as ₹10 to your wallet. Sessions are charged per minute at the astrologer's listed rate, so even a small top-up gets you several minutes of guidance." },
  { q: "Are the astrologers verified?", a: "Yes. Every astrologer passes 3 stages: a written Vedic astrology assessment, background check, and a trial reading evaluated by our senior panel. Only the top 15% are onboarded." },
  { q: "What if the astrologer doesn't respond?", a: "You are never charged if the astrologer doesn't join. The session auto-cancels and your full balance is preserved." },
  { q: "Is my conversation private?", a: "Absolutely. All sessions are end-to-end encrypted and never shared or sold. You can request data deletion at any time." },
  { q: "Can I get a refund?", a: "If a technical issue prevents a session from starting, we issue a full refund. Once a session begins and the astrologer has joined, charges apply per the billing policy." },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${open ? "border-[#f5c842]/60 bg-[#fffbee]" : "border-stone-200 bg-white hover:border-[#f5c842]/30"}`}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between px-5 py-4 text-left gap-4">
        <span className="font-semibold text-slate-800 text-[15px] leading-snug">{q}</span>
        <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all ${open ? "bg-[#f5c842] text-stone-900" : "border border-stone-300 text-stone-400"}`}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <div className="flex gap-0.5">
      {"★".repeat(full).split("").map((s, i) => <span key={i} className="text-[#f5c842] text-sm">{s}</span>)}
      {"☆".repeat(empty).split("").map((s, i) => <span key={i} className="text-stone-300 text-sm">{s}</span>)}
    </div>
  );
}

// ─── Astrologer Card (AstroGuruji style) ─────────────────────────────────────
function AstrologerCard({ a }: { a: Astrologer }) {
  const initials = a.user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const exp = a.experienceYears ?? ((a.id.charCodeAt(0) + a.id.charCodeAt(a.id.length - 1)) % 15 + 1);
  const originalRate = Math.floor(a.ratePerMin * 1.5);
  const langs = a.languages ?? "Hindi, English";

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(245,200,66,0.18)] hover:-translate-y-1 transition-all duration-300 flex-shrink-0 w-[220px] sm:w-auto overflow-hidden">
      {/* Online indicator strip */}
      <div className={`h-1 w-full ${a.isOnline && !a.isBusy ? "bg-emerald-400" : a.isBusy ? "bg-orange-400" : "bg-stone-200"}`} />

      <div className="p-4">
        {/* Avatar + verified */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full border-[2.5px] border-[#f5c842] bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center font-extrabold text-amber-800 text-lg shadow-sm">
              {initials}
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-stone-900 text-[13px] uppercase tracking-wide truncate">{a.user.name}</div>
            <div className="text-[11px] text-stone-500 truncate">{a.speciality ?? "Vedic Astrology"}</div>
            <div className="text-[11px] text-stone-400 truncate">{langs}</div>
          </div>
        </div>

        {/* Rating + orders */}
        <div className="flex items-center gap-2 mb-1">
          <StarRating rating={a.averageRating || 4} />
          <span className="text-[10px] text-stone-400 font-medium">{a.orderCount} orders</span>
        </div>

        {/* Experience */}
        <div className="text-[11px] text-stone-500 mb-3">Experience: <span className="font-semibold text-stone-700">{exp} Years</span></div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {a.ratePerMin > 0 && (
              <span className="text-xs text-red-400 line-through font-medium">₹{originalRate}</span>
            )}
            <span className="font-extrabold text-[#16a34a] text-sm">
              {a.ratePerMin === 0 ? "FREE" : `₹${a.ratePerMin}`}
              {a.ratePerMin > 0 && <span className="text-[10px] text-stone-400 font-normal">/min</span>}
            </span>
          </div>
          {a.isBusy && (
            <span className="text-[9px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">BUSY</span>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/login?callbackUrl=/dashboard"
          className="block w-full py-2.5 rounded-xl text-center font-bold text-sm border-2 border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white transition-all duration-200"
        >
          💬 {a.ratePerMin === 0 ? "Free Chat" : "Chat Now"}
        </Link>
      </div>
    </div>
  );
}

// Skeleton card while loading
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex-shrink-0 w-[220px] sm:w-auto overflow-hidden animate-pulse">
      <div className="h-1 bg-stone-100 w-full" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-stone-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-stone-200 rounded w-3/4" />
            <div className="h-2 bg-stone-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2 bg-stone-100 rounded mb-2 w-2/3" />
        <div className="h-2 bg-stone-100 rounded mb-3 w-1/2" />
        <div className="h-9 bg-stone-100 rounded-xl w-full" />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [loadingAstrologers, setLoadingAstrologers] = useState(true);

  useEffect(() => {
    fetch("/api/astrologers")
      .then(r => r.json())
      .then((data: Astrologer[]) => {
        const sorted = [...data].sort((a, b) => b.reviewCount - a.reviewCount);
        setAstrologers(sorted);
      })
      .catch(() => setAstrologers([]))
      .finally(() => setLoadingAstrologers(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#faf8f5" }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8]" style={{ boxShadow: "0 2px 16px rgba(245,200,66,0.1)" }}>
        {/* Brand gradient strip */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, #1a1040 0%, #2d1b69 40%, #FF9933 70%, #f5c842 100%)" }} />
        <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center justify-between gap-3">
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2">
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-md border-2 border-[#f0c842]/60">
              <img src="/logo.jpeg" alt="AstroWalla Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-extrabold text-[17px] text-stone-900 tracking-tight leading-none group-hover:text-[#d97706] transition-colors">AstroWalla</div>
              <div className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold">Your Celestial Guide</div>
            </div>
          </Link>

          {/* Right CTA */}
          <Link href="/login"
            className="px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 hover:scale-105 shrink-0"
            style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)", boxShadow: "0 4px 12px rgba(255,153,51,0.3)" }}>
            Get Started
          </Link>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="bg-white border-t border-[#f0e6c8] px-5 py-3 flex flex-col gap-1 shadow-lg">
            {[
              ["🏠 Home", "/"],
              ["🔮 Top Astrologers", "#astrologers"],
              ["🛎️ Our Services", "#services"],
              ["⭐ Testimonials", "#testimonials"],
              ["❓ FAQ", "#faq"],
              ["📖 Free Kundli", "/kundli"],
              ["👤 Sign In", "/login"],
            ].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMenuOpen(false)}
                className="py-2.5 px-2 text-sm font-medium text-stone-600 hover:text-[#d97706] hover:bg-[#fffbee] rounded-lg transition-colors">
                {l}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #2d1b08 0%, #5c3010 30%, #8b5a1a 60%, #c4830a 85%, #d4a017 100%)", minHeight: "340px" }}>
        {/* Bokeh light effects */}
        <div className="absolute top-4 right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,200,66,0.35) 0%, transparent 70%)" }} />
        <div className="absolute bottom-8 left-4 w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,153,51,0.25) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)" }} />

        {/* Star dots */}
        {[[8,15],[25,70],[15,42],[35,88],[48,8],[60,76],[12,55],[72,20],[88,65],[5,90]].map(([t,l],i)=>(
          <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{ top:`${t}%`, left:`${l}%`, width: i%3===0?3:2, height: i%3===0?3:2, opacity: 0.3+i*0.04 }}/>
        ))}

        <div className="relative max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center gap-8">
          {/* Text side */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-[10px] font-bold uppercase tracking-widest border"
              style={{ background: "rgba(245,200,66,0.15)", borderColor: "rgba(245,200,66,0.35)", color: "#f5c842" }}>
              ✦ India's Most Trusted Astrology Platform
            </div>

            {/* Hindi headline */}
            <h1 className="font-extrabold leading-tight text-white mb-2" style={{ fontSize: "clamp(28px,6vw,56px)", textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
              एक नया ज्योतिषी
            </h1>
            <h1 className="font-extrabold leading-tight mb-4" style={{ fontSize: "clamp(28px,6vw,56px)", background: "linear-gradient(90deg, #f5c842, #FF9933)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              अनुभव
            </h1>
            <p className="text-white/75 text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0">
              Talk to India's finest Vedic astrologers — live, private, and available right now.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/login"
                className="px-8 py-3.5 rounded-full font-bold text-base text-stone-900 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#f5c842,#FF9933)", boxShadow: "0 8px 24px rgba(245,200,66,0.45)" }}>
                Start Free Consultation →
              </Link>
              <a href="#astrologers"
                className="px-6 py-3.5 rounded-full font-semibold text-base text-white/80 border border-white/20 hover:bg-white/10 transition-all hover:text-white text-center">
                Browse Astrologers
              </a>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 mt-8 justify-center md:justify-start">
              {[["50K+","Happy Seekers"],["Verified","Astrologers"],["4.9★","Avg Rating"]].map(([v,l])=>(
                <div key={l} className="text-center">
                  <div className="text-[#f5c842] font-extrabold text-lg leading-tight">{v}</div>
                  <div className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration side — cosmic orb */}
          <div className="shrink-0 hidden md:flex w-64 h-64 items-center justify-center relative">
            <div className="w-56 h-56 rounded-full border-2 border-[#f5c842]/30 flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(245,200,66,0.15) 0%, rgba(139,70,20,0.3) 100%)" }}>
              <div className="w-40 h-40 rounded-full border border-[#f5c842]/20 flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(245,200,66,0.2) 0%, transparent 80%)" }}>
                <span className="text-7xl opacity-80 select-none" style={{ filter: "drop-shadow(0 0 20px rgba(245,200,66,0.6))" }}>🔯</span>
              </div>
            </div>
            {/* Orbiting elements */}
            {["♈","♋","♎","♑"].map((sign, i) => (
              <div key={sign} className="absolute text-[#f5c842] font-bold text-xl"
                style={{
                  top: `${50 + 42 * Math.sin(i * Math.PI / 2)}%`,
                  left: `${50 + 42 * Math.cos(i * Math.PI / 2)}%`,
                  transform: "translate(-50%, -50%)",
                  textShadow: "0 0 10px rgba(245,200,66,0.5)"
                }}>
                {sign}
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute -bottom-1 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: "100%", height: "60px", display: "block" }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#FFF8EE"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TOP ASTROLOGERS
      ══════════════════════════════════════════ */}
      <section id="astrologers" style={{ background: "#FFF8EE" }} className="py-12 px-0">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center px-5 mb-8">
            <h2 className="text-[26px] sm:text-3xl font-extrabold text-stone-900 mb-2">
              Top <span style={{ color: "#d97706" }}>Astrologers</span>
            </h2>
            <p className="text-stone-500 text-sm font-medium">Connect with our verified and experienced astrologers</p>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          {loadingAstrologers ? (
            <div className="flex gap-4 overflow-x-auto px-5 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible" style={{ scrollbarWidth: "none" }}>
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : astrologers.length === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="text-4xl mb-3">🪷</div>
              <p className="text-stone-500 font-medium">Our astrologers will be available shortly.</p>
              <Link href="/login" className="mt-4 inline-block px-6 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>
                Sign In to View All →
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-5 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible" style={{ scrollbarWidth: "none" }}>
              {astrologers.map(a => <AstrologerCard key={a.id} a={a} />)}
            </div>
          )}

          {/* View all */}
          <div className="text-center mt-6 px-5">
            <Link href="/login?callbackUrl=/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border border-[#f0e6c8] bg-white text-stone-600 hover:border-[#f5c842] hover:text-[#d97706] hover:shadow-md transition-all">
              View All Astrologers
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OUR SERVICES
      ══════════════════════════════════════════ */}
      <section id="services" style={{ background: "#FFF8EE" }} className="py-12 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-3xl font-extrabold text-stone-900 mb-2">
              Our <span style={{ color: "#d97706" }}>Services</span>
            </h2>
            <p className="text-stone-500 text-sm font-medium max-w-md mx-auto">
              Explore A Wide Range Of Astrology Services Designed To Offer Clarity, Guidance, And Meaningful Insights For Your Life.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <Link key={s.title} href="/login?callbackUrl=/dashboard"
                className="bg-white rounded-2xl p-5 border border-[#f0e6c8] hover:border-[#f5c842]/60 hover:shadow-[0_8px_24px_rgba(245,200,66,0.15)] hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="font-bold text-stone-900 text-sm mb-1 group-hover:text-[#d97706] transition-colors">{s.title}</div>
                <div className="text-stone-500 text-[11px] leading-relaxed">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-14 px-5" style={{ background: "#1a1040" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#f5c842" }}>Simple Process</p>
            <h2 className="text-[26px] sm:text-3xl font-extrabold text-white mb-2">Start in 3 Simple Steps</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>From sign-up to astrological insights in under 2 minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { num: "01", emoji: "📱", title: "Create Account", desc: "Enter your phone number, verify with OTP. No passwords, no forms. Ready in 30 seconds.", color: "from-orange-500 to-amber-400" },
              { num: "02", emoji: "💰", title: "Add Balance", desc: "Top up via UPI, card, or Net Banking. Start from as low as ₹10.", color: "from-amber-500 to-yellow-400" },
              { num: "03", emoji: "💬", title: "Chat & Get Guided", desc: "Browse verified astrologers, pick your guide, start your private real-time session.", color: "from-orange-500 to-rose-400" },
            ].map((step) => (
              <div key={step.num} className="relative rounded-2xl p-6 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Big number watermark */}
                <div className="absolute -top-2 -right-1 font-extrabold text-[70px] leading-none select-none pointer-events-none"
                  style={{ color: "rgba(245,200,66,0.08)" }}>{step.num}</div>
                <div className="text-4xl mb-4">{step.emoji}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c842" }}>Step {step.num}</div>
                <h3 className="font-extrabold text-white text-base mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section id="testimonials" style={{ background: "#FFF8EE" }} className="py-14 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-3xl font-extrabold text-stone-900 mb-2">
              What Our <span style={{ color: "#d97706" }}>Seekers Say</span>
            </h2>
            <p className="text-stone-500 text-sm">From 50,000+ verified consultations across India</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-5 border border-[#f0e6c8] hover:border-[#f5c842]/40 hover:shadow-md transition-all duration-200">
                <div className="flex gap-0.5 mb-3">
                  {"★".repeat(t.rating).split("").map((s, i) => <span key={i} className="text-[#f5c842]">{s}</span>)}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#f0e6c8]">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#FF9933] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-stone-900 font-bold text-sm">{t.name}</div>
                    <div className="text-stone-400 text-[11px]">{t.sign} · {t.city}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                    </svg>
                    Verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" className="py-14 px-5 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-[26px] sm:text-3xl font-extrabold text-stone-900 mb-2">
            Frequently <span style={{ color: "#d97706" }}>Asked</span>
          </h2>
          <p className="text-stone-500 text-sm">Everything you need to know before your first session.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="px-5 pb-16 max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden text-center px-8 py-14"
          style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)", border: "1px solid rgba(245,200,66,0.2)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.15) 0%, transparent 60%)" }}/>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#f5c842" }}>Begin Your Journey</p>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-white mb-3">Your Destiny Awaits</h2>
            <p className="text-base mb-8 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              50,000 seekers already found their answers. The stars are ready — are you?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" id="bottom-cta"
                className="px-8 py-3.5 rounded-full font-bold text-base text-stone-900 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg,#f5c842,#FF9933)", boxShadow: "0 8px 32px rgba(245,200,66,0.4)" }}>
                Get Started Free →
              </Link>
              <a href="#astrologers"
                className="px-6 py-3.5 rounded-full font-semibold text-base transition-all text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
                Browse Astrologers
              </a>
            </div>
            <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No subscription · Pay per minute · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#130e30" }}>
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border border-white/20 shrink-0">
                  <img src="/logo.jpeg" alt="AstroWalla Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight">AstroWalla</span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                India's most trusted platform for real-time Vedic astrology consultations.
              </p>
              <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>help.astrowalla@gmail.com</div>
            </div>
            {[
              { title: "Services", links: [["Chat with Astrologer","/login"],["Free Kundli","/kundli"]] },
              { title: "Company", links: [["About Us","/about-us"],["Become an Astrologer","/astrologer/login"],["Contact Us","/contact-us"]] },
              { title: "Legal", links: [["Privacy Policy","/privacy-policy"],["Terms of Service","/terms-and-conditions"],["Refund Policy","/refund-and-cancellation"],["User Guidelines","/user-guidelines"]] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-semibold text-white mb-4 text-sm">{col.title}</p>
                {(col.links as [string,string][]).map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm mb-2.5 transition-colors hover:text-[#f5c842]"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>© {new Date().getFullYear()} AstroWalla. All rights reserved.</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>✦ Guided by the Stars ✦</p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>All systems operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
