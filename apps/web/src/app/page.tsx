"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    title: "Vedic Astrology",
    desc: "Ancient Jyotish wisdom — Kundali, Dasha, Nakshatras — decoded by certified practitioners.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    title: "Live Chat Sessions",
    desc: "Real-time private consultations with your astrologer. No appointments, just instant answers.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    title: "Secure Wallet",
    desc: "Pay-as-you-go with our encrypted wallet. Add funds in seconds, never charged for waiting.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>,
    title: "Verified Experts",
    desc: "Every astrologer passes a 3-round vetting — written test, background check, trial reading.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: "Honest Reviews",
    desc: "Every rating from a verified, real session. Zero paid reviews. Total transparency.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    title: "24 / 7 Available",
    desc: "The cosmos never sleeps. Connect with an astrologer any hour of the day or night.",
  },
];

const TESTIMONIALS = [
  { name: "Priya S.", city: "Mumbai", sign: "Scorpio", text: "My astrologer's guidance on my career switch was unnervingly accurate. I landed my dream job exactly when predicted.", rating: 5 },
  { name: "Rahul M.", city: "Bangalore", sign: "Aries", text: "I was skeptical at first. After my relationship reading, I got clarity I hadn't found in years of therapy.", rating: 5 },
  { name: "Ananya K.", city: "Delhi", sign: "Cancer", text: "The Kundali analysis was so personal — it felt like she already knew my entire life. Referred 6 friends.", rating: 5 },
  { name: "Vikram T.", city: "Pune", sign: "Capricorn", text: "Connected at midnight during a business panic. Every date the astrologer predicted came true.", rating: 5 },
  { name: "Sneha R.", city: "Chennai", sign: "Virgo", text: "Booked a 10-minute session, stayed 45 minutes. The health insights were spot on. First time user blown away.", rating: 5 },
  { name: "Arjun P.", city: "Hyderabad", sign: "Aquarius", text: "Best ₹200 I ever spent. Predicted my promotion to the exact week. A regular user now.", rating: 5 },
];

const FAQS = [
  { q: "How does the chat session work?", a: "After adding funds, pick any available astrologer and click 'Chat Now'. You're connected in real-time within seconds. The session is charged per minute — only when the astrologer has joined and you're actively chatting." },
  { q: "What is the minimum recharge amount?", a: "You can add as little as ₹50 to your wallet. Sessions are charged per minute at the astrologer's listed rate, so even a small top-up gets you several minutes of guidance." },
  { q: "Are the astrologers verified?", a: "Yes. Every astrologer passes 3 stages: a written Vedic astrology assessment, background check, and a trial reading evaluated by our senior panel. Only the top 15% are onboarded." },
  { q: "What if the astrologer doesn't respond?", a: "You are never charged if the astrologer doesn't join within 10 minutes. The session auto-cancels and your full balance is preserved. You can connect with another astrologer immediately." },
  { q: "Is my conversation private?", a: "Absolutely. All sessions are end-to-end encrypted and never shared or sold. You can request data deletion at any time." },
  { q: "Can I get a refund?", a: "If a technical issue prevents a session from starting, we issue a full refund within 24 hours. Once a session begins and the astrologer has joined, charges apply per the billing policy." },
];

const ASTROLOGERS = [
  { name: "Pandit Ravi Shankar", spec: "Vedic & Kundali", exp: "18 yrs", rate: "₹45/min", rating: "4.9", reviews: "2,341", lang: "Hindi, English", color: "from-orange-500 to-amber-400" },
  { name: "Astro Kavitha Devi", spec: "Relationship & Tarot", exp: "12 yrs", rate: "₹35/min", rating: "4.8", reviews: "1,876", lang: "Tamil, English", color: "from-rose-400 to-orange-400" },
  { name: "Guru Anand Joshi", spec: "Career & Finance", exp: "22 yrs", rate: "₹60/min", rating: "5.0", reviews: "4,102", lang: "Hindi, Gujarati", color: "from-amber-500 to-yellow-400" },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-orange-200 bg-orange-50/50 shadow-sm shadow-orange-100" : "border-stone-200 bg-white hover:border-stone-300"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between px-6 py-5 text-left gap-4">
        <span className="font-semibold text-slate-800 text-[15px] leading-snug">{q}</span>
        <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all ${open ? "bg-orange-500 text-white" : "border border-stone-300 text-stone-400"}`}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#F4ECD8" }}>

      {/* ── HERO (dark navy section) ── */}
      <div style={{ background: "linear-gradient(160deg, #1a1040 0%, #2d1b69 40%, #1e1245 70%, #160d35 100%)" }}>
        {/* Navbar — dark */}
        <nav className="sticky top-0 z-50" style={{ background: "rgba(20,12,50,0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>ॐ</div>
              <span className="font-cinzel font-black text-white text-[17px] tracking-wide">CosmicInsight</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/60">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#astrologers" className="hover:text-white transition-colors">Astrologers</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors px-2 py-1.5">Sign In</Link>
              <Link href="/login" id="nav-cta"
                className="px-5 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>
                Get Started
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden px-5 py-3 flex flex-col gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(20,12,50,0.95)" }}>
              {[["How It Works", "#how-it-works"], ["Astrologers", "#astrologers"], ["Reviews", "#testimonials"], ["FAQ", "#faq"]].map(([l, h]) => (
                <a key={l} href={h} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-medium text-white/60 hover:text-white">{l}</a>
              ))}
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <section className="relative overflow-hidden px-5 pt-24 pb-32 text-center">
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,153,51,0.12) 0%, transparent 60%)" }} />
          <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />
          <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,200,66,0.1) 0%, transparent 70%)" }} />

          {/* Subtle star dots */}
          {[[8,15],[25,70],[15,42],[35,88],[48,8],[55,60],[22,91],[42,33],[60,76],[12,55]].map(([t,l],i)=>(
            <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{ top:`${t}%`,left:`${l}%`,width:i%3===0?3:2,height:i%3===0?3:2,opacity:0.2+i*0.04 }}/>
          ))}

          {/* OM watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ opacity: 0.04 }}>
            <span className="font-cinzel font-black text-amber-300" style={{ fontSize: "clamp(200px,40vw,480px)" }}>ॐ</span>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "rgba(255,153,51,0.12)", borderColor: "rgba(255,153,51,0.3)", color: "#FFB347" }}>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><polygon points="10 1 12.63 7.18 19.51 7.64 14.5 11.97 16.18 18.64 10 14.9 3.82 18.64 5.5 11.97 .49 7.64 7.37 7.18"/></svg>
              India's Most Trusted Astrology Platform
            </div>

            <h1 className="font-cinzel font-black leading-tight mb-6" style={{ fontSize: "clamp(42px,7vw,90px)", color: "#FFFFFF" }}>
              The Stars Have<br/>
              <span style={{ background: "linear-gradient(90deg,#FF9933,#f5c842,#FF9933)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Your Answers
              </span>
            </h1>

            <p className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10 font-normal" style={{ color: "rgba(255,255,255,0.65)" }}>
              Talk to India's finest Vedic astrologers — live, private, and available right now.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
              <Link href="/login" id="hero-cta-primary"
                className="px-9 py-4 rounded-full font-bold text-base text-white transition-all hover:opacity-90 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
                style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)", boxShadow: "0 8px 32px rgba(255,153,51,0.4)" }}>
                Start Your Journey →
              </Link>
              <Link href="/login" id="hero-cta-secondary"
                className="px-7 py-4 rounded-full font-semibold text-base transition-all w-full sm:w-auto"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}
                onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.15)"; }}
                onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)"; }}>
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { val: "50,000+", label: "Happy Seekers" },
                { val: "200+", label: "Expert Astrologers" },
                { val: "4.9★", label: "Average Rating" },
                { val: "24/7", label: "Available" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl px-4 py-4 text-center" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="font-cinzel font-black text-2xl mb-0.5" style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Curved wave divider */}
          <div className="absolute -bottom-1 left-0 right-0 pointer-events-none">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: "100%", height: "80px", display: "block" }}>
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#F4ECD8"/>
            </svg>
          </div>
        </section>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-5 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Simple Process</p>
          <h2 className="font-cinzel text-4xl font-black text-slate-900 mb-3">Start in 3 Steps</h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">From sign-up to cosmic insights in under 2 minutes.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: "01", title: "Create Account", desc: "Enter your number, verify with OTP. No passwords, no forms. Ready in 30 seconds.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>, bg: "from-orange-500 to-amber-400" },
            { num: "02", title: "Add Balance", desc: "Top up via UPI, card, or Net Banking. Start from as low as ₹50.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>, bg: "from-amber-500 to-yellow-400" },
            { num: "03", title: "Chat & Get Guided", desc: "Browse verified astrologers, pick your guide, start your private real-time session.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, bg: "from-orange-500 to-rose-400" },
          ].map((step) => (
            <div key={step.num} className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden border border-stone-100 hover:-translate-y-1">
              <div className="absolute -top-3 -right-2 font-cinzel font-black text-[80px] text-orange-100 leading-none select-none pointer-events-none">{step.num}</div>
              <div className={`relative w-13 h-13 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.bg} flex items-center justify-center text-white shadow-lg mb-6`}
                style={{ boxShadow: "0 4px 16px rgba(255,153,51,0.35)" }}>
                {step.icon}
              </div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Step {step.num}</div>
              <h3 className="font-cinzel font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: "#1a1040" }} className="px-5 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#FFB347" }}>Why CosmicInsight</p>
            <h2 className="font-cinzel text-4xl font-black mb-3 text-white">Built for Real Results</h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>Everything you need for an authentic, trustworthy astrology experience.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl p-7 group hover:-translate-y-1 transition-all duration-300 cursor-default"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(4px)" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,153,51,0.3)"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(255,153,51,0.15)", color: "#FF9933" }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASTROLOGERS ── */}
      <section id="astrologers" className="px-5 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Meet Our Guides</p>
          <h2 className="font-cinzel text-4xl font-black text-slate-900 mb-3">Featured Astrologers</h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">Handpicked, verified, and trusted by thousands of seekers.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {ASTROLOGERS.map((a) => {
            const initials = a.name.split(" ").slice(0,2).map(w=>w[0]).join("");
            return (
              <div key={a.name} className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-stone-100">
                {/* Gradient top strip */}
                <div className={`h-2 w-full bg-gradient-to-r ${a.color}`} />
                <div className="p-7">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center font-cinzel font-black text-white text-xl shadow-md`}>{initials}</div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.5)" }}/>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-[15px] leading-tight">{a.name}</div>
                      <div className="text-xs text-orange-500 font-semibold mt-0.5 uppercase tracking-wider">{a.spec}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {[{ l:"Exp",v:a.exp },{ l:"Rate",v:a.rate },{ l:"Rating",v:a.rating },{ l:"Reviews",v:a.reviews }].map(item=>(
                      <div key={item.l} className="text-center rounded-xl bg-stone-50 border border-stone-100 px-1.5 py-2">
                        <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{item.l}</div>
                        <div className="text-[11px] font-bold text-slate-700">{item.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>
                    {a.lang}
                  </div>
                  <Link href="/login"
                    className="block w-full py-3 rounded-2xl text-white text-center font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)", boxShadow: "0 4px 16px rgba(255,153,51,0.25)" }}>
                    Chat Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-500 transition-colors border border-stone-200 hover:border-orange-200 px-6 py-3 rounded-full bg-white hover:shadow-sm">
            View all astrologers
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ background: "#1a1040" }} className="px-5 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#FFB347" }}>Real Stories</p>
            <h2 className="font-cinzel text-4xl font-black text-white mb-3">What Seekers Say</h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>From 50,000+ verified consultations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Stars n={t.rating} />
                <p className="text-sm leading-relaxed mt-4 mb-6 flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t.sign} · {t.city}</div>
                  </div>
                  <div className="ml-auto text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    Verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-5 py-24 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Got Questions?</p>
          <h2 className="font-cinzel text-4xl font-black text-slate-900 mb-3">Frequently Asked</h2>
          <p className="text-slate-500 text-base">Everything you need before your first session.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 pb-24 max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden text-center px-10 py-16"
          style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)", border: "1px solid rgba(255,153,51,0.2)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,153,51,0.15) 0%, transparent 60%)" }}/>
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#FFB347" }}>Begin Your Journey</p>
            <h2 className="font-cinzel text-4xl font-black text-white mb-4">Your Destiny Awaits</h2>
            <p className="text-base mb-10 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              50,000 seekers already found their answers. The stars are ready — are you?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" id="bottom-cta"
                className="px-9 py-4 rounded-full font-bold text-base text-white hover:opacity-90 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)", boxShadow: "0 8px 32px rgba(255,153,51,0.4)" }}>
                Get Started Free
              </Link>
              <Link href="/login"
                className="px-7 py-4 rounded-full font-semibold text-base transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
                Browse Astrologers
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No subscription · Pay per minute · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#130e30" }}>
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>ॐ</div>
                <span className="font-cinzel font-black text-white">CosmicInsight</span>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>India's most trusted platform for real-time Vedic astrology consultations.</p>
              <div className="flex gap-2.5">
                {[
                  <svg key="fb" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
                  <svg key="tw" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>,
                  <svg key="ig" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
                  <svg key="yt" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
                ].map((icon,i)=>(
                  <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.35)" }}
                    onMouseOver={e=>{(e.currentTarget as HTMLDivElement).style.color="#FF9933";(e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,153,51,0.4)";}}
                    onMouseOut={e=>{(e.currentTarget as HTMLDivElement).style.color="rgba(255,255,255,0.35)";(e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.1)";}}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: "Services", links: ["Chat with Astrologer","Kundali Analysis","Love & Marriage","Career Guidance","Vastu Shastra","Tarot Reading"] },
              { title: "Company", links: ["About Us","Become an Astrologer","Careers","Blog","Press"] },
              { title: "Support", links: ["Help Center","Privacy Policy","Terms of Service","Refund Policy","Contact Us"] },
            ].map(col=>(
              <div key={col.title}>
                <p className="font-semibold text-white mb-4 text-sm">{col.title}</p>
                {col.links.map(l=>(
                  <p key={l} className="text-sm mb-2.5 cursor-pointer transition-colors" style={{ color:"rgba(255,255,255,0.35)" }}
                    onMouseOver={e=>{(e.currentTarget as HTMLParagraphElement).style.color="rgba(255,255,255,0.8)";}}
                    onMouseOut={e=>{(e.currentTarget as HTMLParagraphElement).style.color="rgba(255,255,255,0.35)";}}>
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color:"rgba(255,255,255,0.25)" }}>© {new Date().getFullYear()} CosmicInsight. All rights reserved.</p>
            <p className="font-cinzel text-xs" style={{ color:"rgba(255,255,255,0.25)" }}>✦ Guided by the Stars ✦</p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
