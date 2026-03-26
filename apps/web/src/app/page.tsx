"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🪷", title: "Vedic Astrology", desc: "Ancient Jyotish wisdom decoded by certified practitioners for your life's blueprint — Kundali, Dasha, Nakshatras and more." },
  { icon: "💬", title: "Live Chat Sessions", desc: "Real-time, private consultations with your chosen astrologer. No appointments, no waiting rooms — just answers." },
  { icon: "🔱", title: "Secure Wallet", desc: "Pay-as-you-go with our encrypted wallet. Add funds in seconds, never get charged for waiting." },
  { icon: "✅", title: "Verified Experts", desc: "Every astrologer passes our 3-round vetting — accuracy tests, background checks, and trial readings." },
  { icon: "⭐", title: "Honest Reviews", desc: "Every rating is from a real, verified session. No paid reviews, no manipulation. Pure transparency." },
  { icon: "🌙", title: "24/7 Availability", desc: "The cosmos never sleeps. Connect with an astrologer any hour — even at 3am when doubt strikes hardest." },
];

const TESTIMONIALS = [
  { name: "Priya S.", city: "Mumbai", sign: "♏ Scorpio", text: "My astrologer's guidance on my career switch was unnervingly accurate. I landed my dream job exactly when she predicted. This platform changed my life.", rating: 5, img: "P" },
  { name: "Rahul M.", city: "Bangalore", sign: "♈ Aries", text: "I was skeptical at first. But after my relationship reading, I got the kind of clarity I hadn't found in years of therapy. Truly humbling experience.", rating: 5, img: "R" },
  { name: "Ananya K.", city: "Delhi", sign: "♋ Cancer", text: "The Kundali analysis was so detailed and personal — it felt like she already knew my entire life. I've referred 6 friends already.", rating: 5, img: "A" },
  { name: "Vikram T.", city: "Pune", sign: "♑ Capricorn", text: "Connected at midnight during a panic attack about my business. The astrologer calmed me, gave me a timeline, and every date came true.", rating: 5, img: "V" },
  { name: "Sneha R.", city: "Chennai", sign: "♍ Virgo", text: "First time user and I was blown away. Booked a 10-minute session, stayed for 45. The insights on my health were spot on.", rating: 5, img: "S" },
  { name: "Arjun P.", city: "Hyderabad", sign: "♒ Aquarius", text: "Best ₹200 I ever spent. The astrologer predicted my promotion month correct to the week. I'm now a believer and a regular.", rating: 5, img: "A" },
];

const FAQS = [
  { q: "How does the chat session work?", a: "After adding funds to your wallet, pick any available astrologer and click 'Chat Now'. You're connected in real-time within seconds. The session is charged per minute — only when the astrologer has joined and you're actively chatting." },
  { q: "What is the minimum recharge amount?", a: "You can add as little as ₹50 to your wallet. Sessions are charged per minute at the astrologer's listed rate, so even a small top-up gets you started with several minutes of guidance." },
  { q: "Are the astrologers verified?", a: "Yes. Every astrologer on CosmicInsight goes through a 3-stage vetting process: a written assessment on Vedic astrology, a background check, and a trial reading evaluated by our senior panel. Only the top 15% are onboarded." },
  { q: "What if the astrologer doesn't respond?", a: "You are never charged if the astrologer doesn't join the session within 10 minutes. The session auto-cancels and your full balance is preserved. You can immediately connect with another available astrologer." },
  { q: "Is my conversation private?", a: "Absolutely. All chat sessions are end-to-end encrypted. Your conversations are never shared, sold, or used for any purpose other than your session. You can request deletion of your data at any time." },
  { q: "Can I get a refund?", a: "If you face any technical issue that prevents a session from starting, we issue a full refund within 24 hours. Once a session has begun and the astrologer has joined, charges apply per the billing policy." },
];

const ASTROLOGERS = [
  { name: "Pandit Ravi Shankar", spec: "Vedic & Kundali Expert", exp: "18 yrs", rate: "₹45/min", rating: "4.9", reviews: 2341, lang: "Hindi, English", sign: "☿" },
  { name: "Astro Kavitha Devi", spec: "Relationship & Tarot", exp: "12 yrs", rate: "₹35/min", rating: "4.8", reviews: 1876, lang: "Tamil, English", sign: "♀" },
  { name: "Guru Anand Joshi", spec: "Career & Finance", exp: "22 yrs", rate: "₹60/min", rating: "5.0", reviews: 4102, lang: "Hindi, Gujarati", sign: "♃" },
];

const STATS = [
  { val: "50,000+", label: "Happy Seekers" },
  { val: "200+", label: "Expert Astrologers" },
  { val: "4.9★", label: "Average Rating" },
  { val: "24/7", label: "Always Available" },
];

// ─── Stars array (fixed, no hydration issues) ─────────────────────────────────
const STARS = [
  { top: 8, left: 12, size: 2, delay: 0, dur: 3.2 },
  { top: 15, left: 78, size: 1.5, delay: 1.1, dur: 2.8 },
  { top: 23, left: 45, size: 2, delay: 0.5, dur: 4.1 },
  { top: 31, left: 91, size: 1, delay: 2.2, dur: 3.6 },
  { top: 42, left: 6, size: 2, delay: 0.8, dur: 2.5 },
  { top: 55, left: 33, size: 1.5, delay: 1.7, dur: 3.9 },
  { top: 67, left: 88, size: 2, delay: 0.3, dur: 2.7 },
  { top: 4, left: 55, size: 1, delay: 3.1, dur: 3.8 },
  { top: 48, left: 97, size: 1.5, delay: 0.2, dur: 2.6 },
  { top: 72, left: 25, size: 2, delay: 2.5, dur: 2.4 },
  { top: 88, left: 63, size: 1.5, delay: 0.4, dur: 4.2 },
  { top: 19, left: 38, size: 1, delay: 2.8, dur: 2.8 },
  { top: 62, left: 17, size: 2, delay: 1.6, dur: 3.5 },
  { top: 85, left: 82, size: 1, delay: 0.9, dur: 2.3 },
  { top: 37, left: 60, size: 2, delay: 1.3, dur: 3.7 },
];

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#f5c842]/20 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm transition-all hover:border-[#f5c842]/40">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-7 py-5 text-left">
        <span className="font-bold text-slate-800 text-[15px] pr-4">{q}</span>
        <span className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg transition-all"
          style={{ background: open ? "linear-gradient(135deg,#FF9933,#f5c842)" : "#faf8f5", color: open ? "white" : "#FF9933", border: open ? "none" : "1px solid rgba(245,200,66,0.3)" }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-7 pb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#f5c842]/30 to-transparent mb-5" />
          <p className="text-slate-600 text-[14.5px] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const CSS = `
    @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.9;transform:scale(1.5)} }
    @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.08} 50%{transform:translate(60px,-40px) scale(1.2);opacity:.14} }
    @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1.05);opacity:.06} 50%{transform:translate(-40px,60px) scale(.95);opacity:.11} }
    @keyframes aurora3 { 0%,100%{transform:translate(0,0);opacity:.07} 60%{transform:translate(30px,30px);opacity:.12} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(3deg)} }
    @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes breatheOm { 0%,100%{opacity:.04;transform:scale(1)} 50%{opacity:.07;transform:scale(1.03)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes spinSlow { to{transform:rotate(360deg)} }
    @keyframes glowBtn { 0%,100%{box-shadow:0 4px 24px rgba(255,153,51,.35)} 50%{box-shadow:0 4px 40px rgba(255,153,51,.65),0 0 0 8px rgba(255,153,51,.08)} }
    @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .animate-float-slow { animation: floatSlow 7s ease-in-out infinite; }
    .animate-shimmer { background: linear-gradient(90deg, #FF9933, #f5c842, #FF9933); background-size: 200% auto; animation: shimmer 3s linear infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .animate-slide-up { animation: slideUp 0.7s cubic-bezier(.16,1,.3,1) both; }
    .animate-fade-in { animation: fadeIn 0.8s ease both; }
  `;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#faf8f5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{CSS}</style>

      {/* ── GLOBAL AURORA BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,153,51,1) 0%, transparent 70%)", animation: "aurora1 16s ease-in-out infinite" }} />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,200,66,1) 0%, transparent 70%)", animation: "aurora2 20s ease-in-out infinite" }} />
        <div className="absolute top-[40%] left-[40%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,200,100,1) 0%, transparent 70%)", animation: "aurora3 12s ease-in-out infinite" }} />

        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-[#f5c842] pointer-events-none"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50" style={{ background: "rgba(250,248,245,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(245,200,66,0.2)", boxShadow: "0 2px 20px rgba(255,153,51,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center shadow-md" style={{ animation: "spinSlow 20s linear infinite" }}>
              <span className="text-white font-bold text-lg">ॐ</span>
            </div>
            <div>
              <div className="font-cinzel text-[18px] font-black text-slate-900 leading-none">CosmicInsight</div>
              <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#FF9933] leading-none mt-0.5">Guided by the Stars</div>
            </div>
          </div>

          {/* Nav links desktop */}
          <div className="hidden md:flex items-center gap-8 text-[13px] font-bold uppercase tracking-widest text-slate-500">
            <a href="#how-it-works" className="hover:text-[#FF9933] transition-colors">How It Works</a>
            <a href="#astrologers" className="hover:text-[#FF9933] transition-colors">Astrologers</a>
            <a href="#testimonials" className="hover:text-[#FF9933] transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-[#FF9933] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#FF9933] transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link href="/login" id="nav-cta"
              className="px-6 py-2.5 rounded-full font-extrabold text-[13px] uppercase tracking-widest text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg, #FF9933, #f5c842)", animation: "glowBtn 3s ease-in-out infinite" }}>
              Get Started
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5">
              <span className="w-5 h-0.5 bg-slate-600 rounded" />
              <span className="w-5 h-0.5 bg-slate-600 rounded" />
              <span className="w-3 h-0.5 bg-slate-600 rounded" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-[13px] font-bold uppercase tracking-widest text-slate-600 border-t border-[#f5c842]/15">
            {["How It Works", "Astrologers", "Reviews", "FAQ"].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMenuOpen(false)} className="py-2 hover:text-[#FF9933] transition-colors">{link}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-10 pb-20 z-10">
        {/* Floating OM */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ animation: "breatheOm 8s ease-in-out infinite" }}>
          <span className="text-[#FF9933] font-bold opacity-[0.05]" style={{ fontSize: "clamp(180px, 40vw, 420px)", lineHeight: 1 }}>ॐ</span>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto animate-slide-up">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 text-xs font-extrabold uppercase tracking-widest bg-white/80 border border-[#f5c842]/30 shadow-sm backdrop-blur-sm"
            style={{ color: "#d97706" }}>
            <span className="animate-float inline-block">🪷</span>
            India's Most Trusted Astrology Platform
            <span className="animate-float inline-block" style={{ animationDelay: "0.8s" }}>🪷</span>
          </div>

          <h1 className="font-cinzel text-5xl sm:text-6xl md:text-8xl font-black leading-[1.05] mb-6">
            <span className="text-slate-800">The Stars</span>
            <br />
            <span className="animate-shimmer">Have Your Answers</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Connect instantly with India's finest Vedic astrologers for guidance on love, career,
            health, and destiny — one private conversation at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/login" id="hero-cta-primary"
              className="group relative px-10 py-4 rounded-full font-extrabold text-lg text-white w-full sm:w-auto overflow-hidden shadow-xl hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg, #FF9933, #f5c842)", animation: "glowBtn 3s ease-in-out infinite" }}>
              <span className="relative z-10">✨ Start Your Journey</span>
            </Link>
            <Link href="/login" id="hero-cta-secondary"
              className="px-8 py-4 rounded-full font-bold text-lg border-2 border-[#f5c842]/40 hover:border-[#FF9933]/60 bg-white/60 backdrop-blur-sm w-full sm:w-auto text-slate-700 hover:text-[#FF9933] transition-all hover:bg-white/80 hover:shadow-md">
              Already a member? Sign In →
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#f5c842]/15 rounded-3xl overflow-hidden border border-[#f5c842]/20 shadow-xl max-w-3xl mx-auto">
            {STATS.map((s, i) => (
              <div key={s.label} className="bg-white/80 backdrop-blur-sm px-6 py-6 text-center hover:bg-white transition-colors"
                style={{ animation: `countUp 0.6s ${i * 0.1}s both` }}>
                <div className="font-cinzel text-3xl font-black mb-1" style={{ background: "linear-gradient(135deg,#FF9933,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {s.val}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#f5c842] to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── SCROLLING TRUST BAR ── */}
      <div className="relative z-10 py-3 overflow-hidden border-y border-[#f5c842]/20" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}>
        <div className="flex" style={{ animation: "marquee 30s linear infinite", width: "max-content" }}>
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-8 px-4 shrink-0">
              {["✦ Love & Relationships", "✦ Career & Finance", "✦ Health & Wellness", "✦ Marriage & Family", "✦ Kundali Analysis", "✦ Vastu Shastra", "✦ Numerology", "✦ Tarot Readings", "✦ Nadi Astrology", "✦ Prashna Kundali"].map((t) => (
                <span key={t} className="text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#FF9933] transition-colors whitespace-nowrap">{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 px-4 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-black uppercase tracking-widest mb-4">✦ Simple Process</div>
          <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Start in <span className="animate-shimmer">3 Steps</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">From signup to cosmic insights in under 2 minutes.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[3.5rem] left-[33%] right-[33%] h-px" style={{ background: "linear-gradient(90deg, rgba(245,200,66,0.4), rgba(255,153,51,0.4))" }} />

          {[
            { num: "01", icon: "📱", title: "Create Account", desc: "Enter your number, verify with OTP. No passwords, no forms. Ready in 30 seconds flat.", color: "#FF9933" },
            { num: "02", icon: "💳", title: "Add Wallet Balance", desc: "Securely top up using UPI, Debit/Credit card, or Net Banking. Start from as low as ₹50.", color: "#f5c842" },
            { num: "03", icon: "🔮", title: "Chat with Astrologer", desc: "Browse verified astrologers, pick your guide, and start your private real-time session.", color: "#FF9933" },
          ].map((step, i) => (
            <div key={step.num} className="relative group">
              <div className="bg-white/80 backdrop-blur-sm border border-[#f5c842]/20 rounded-3xl p-8 hover:border-[#FF9933]/40 hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(255,153,51,0.12)] h-full relative overflow-hidden">
                {/* Number watermark */}
                <div className="absolute -top-4 -right-2 font-cinzel text-[80px] font-black opacity-[0.06] leading-none select-none" style={{ color: step.color }}>{step.num}</div>

                <div className="relative z-10">
                  {/* Step badge */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 text-3xl shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`, border: `1.5px solid ${step.color}30` }}>
                    {step.icon}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: step.color }}>Step {step.num}</div>
                  <h3 className="font-cinzel font-bold text-slate-800 text-xl mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="relative z-10 px-4 py-20" style={{ background: "linear-gradient(180deg, transparent, rgba(245,200,66,0.04), transparent)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-black uppercase tracking-widest mb-4">✦ Why CosmicInsight</div>
            <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-4">
              Ancient Wisdom, <span className="animate-shimmer">Modern Access</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">Everything you need for a real, meaningful astrology experience.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="group bg-white/70 backdrop-blur-sm border border-[#f5c842]/20 rounded-3xl p-8 hover:border-[#FF9933]/40 hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-[0_8px_40px_rgba(255,153,51,0.1)]"
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,153,51,0.2))", animation: `floatSlow ${5 + i}s ease-in-out ${i * 0.5}s infinite` }}>
                  {f.icon}
                </div>
                <h3 className="font-cinzel font-bold text-slate-800 text-lg mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ASTROLOGERS ── */}
      <section id="astrologers" className="relative z-10 px-4 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-black uppercase tracking-widest mb-4">✦ Meet Our Guides</div>
          <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Top <span className="animate-shimmer">Astrologers</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">Handpicked, verified, and trusted by thousands of seekers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ASTROLOGERS.map((a, i) => (
            <div key={a.name} className="bg-white/80 backdrop-blur-sm border border-[#f5c842]/20 rounded-3xl p-7 hover:border-[#FF9933]/40 hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-[0_8px_40px_rgba(255,153,51,0.12)] group">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center text-3xl text-white font-bold shadow-lg"
                    style={{ boxShadow: "0 4px 20px rgba(255,153,51,0.35)" }}>
                    {a.sign}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white"
                    style={{ boxShadow: "0 0 8px rgba(52,211,153,0.6)" }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-[15px] leading-tight">{a.name}</div>
                  <div className="text-[11px] text-[#FF9933] font-bold uppercase tracking-wider mt-0.5">{a.spec}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Experience", val: a.exp },
                  { label: "Rate", val: a.rate },
                  { label: "Rating", val: `${a.rating} ★` },
                  { label: "Reviews", val: a.reviews.toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="bg-[#faf8f5] rounded-xl px-3 py-2.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">{item.label}</div>
                    <div className="font-cinzel font-bold text-slate-700 text-sm">{item.val}</div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 font-bold mb-5 uppercase tracking-wider">🌐 {a.lang}</div>

              <Link href="/login"
                className="block w-full py-3 rounded-2xl text-center font-extrabold text-sm uppercase tracking-wider transition-all group-hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #FF9933, #f5c842)", color: "white" }}>
                Chat Now ✦
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#f5c842]/40 font-bold uppercase tracking-widest text-sm text-slate-600 hover:border-[#FF9933]/60 hover:text-[#FF9933] transition-all bg-white/60 hover:bg-white/80 hover:shadow-md">
            View All Astrologers →
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="relative z-10 px-4 py-24" style={{ background: "linear-gradient(180deg, transparent, rgba(255,153,51,0.03), transparent)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-black uppercase tracking-widest mb-4">✦ Real Stories</div>
            <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-4">
              What Seekers <span className="animate-shimmer">Say</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium">From 50,000+ verified consultations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="bg-white/80 backdrop-blur-sm border border-[#f5c842]/20 rounded-3xl p-7 hover:border-[#FF9933]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(255,153,51,0.09)] flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-[#f5c842] text-lg" style={{ filter: "drop-shadow(0 0 4px rgba(245,200,66,0.5))" }}>★</span>
                  ))}
                </div>

                {/* Quote */}
                <div className="text-4xl text-[#f5c842]/20 font-cinzel font-black leading-none mb-3">&ldquo;</div>
                <p className="text-slate-600 text-[14.5px] leading-relaxed flex-1 font-medium italic mb-6">{t.text}</p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-[#f5c842]/15">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-md"
                    style={{ background: "linear-gradient(135deg, #FF9933, #f5c842)" }}>
                    {t.img}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{t.sign} · {t.city}</div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider">✓ Verified</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 px-4 py-24 max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-black uppercase tracking-widest mb-4">✦ Got Questions?</div>
          <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Frequently <span className="animate-shimmer">Asked</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">Everything you need to know before your first session.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto text-center">
        <div className="relative rounded-[3rem] p-16 overflow-hidden border border-[#f5c842]/30 bg-white/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(255,153,51,0.12)]">
          {/* Internal decorative blobs */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none" style={{ background: "rgba(255,153,51,0.08)" }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[60px] pointer-events-none" style={{ background: "rgba(245,200,66,0.08)" }} />

          {/* Floating zodiac symbols */}
          {["♈","♎","♌","♒"].map((z, i) => (
            <div key={i} className="absolute text-[#f5c842]/10 font-bold text-4xl pointer-events-none select-none"
              style={{ top: `${20 + i * 20}%`, left: i % 2 === 0 ? "5%" : "92%", animation: `floatSlow ${6 + i}s ease-in-out ${i}s infinite` }}>
              {z}
            </div>
          ))}

          <div className="relative z-10">
            <div className="inline-block text-6xl mb-6 animate-float">🪷</div>
            <h2 className="font-cinzel text-4xl md:text-5xl font-black text-slate-800 mb-5">
              Your Destiny Awaits
            </h2>
            <p className="text-slate-500 text-lg mb-10 font-medium max-w-xl mx-auto leading-relaxed">
              The universe has been waiting to speak to you. 50,000 seekers already found their answers — your story starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" id="bottom-cta"
                className="inline-flex items-center justify-center px-12 py-5 rounded-full font-extrabold text-lg text-white shadow-xl hover:scale-105 transition-all uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg, #FF9933, #f5c842)", animation: "glowBtn 3s ease-in-out infinite" }}>
                Begin Now ✦
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center px-8 py-5 rounded-full font-bold text-slate-600 hover:text-[#FF9933] border-2 border-[#f5c842]/30 hover:border-[#FF9933]/50 transition-all text-base bg-white/60 hover:bg-white/80">
                Browse Astrologers
              </Link>
            </div>
            <p className="mt-6 text-[12px] text-slate-400 font-medium">✦ No subscription · Pay per minute · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#f5c842]/20 bg-white/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ॐ</span>
                </div>
                <span className="font-cinzel font-black text-slate-800 text-lg">CosmicInsight</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">India's most trusted platform for real-time Vedic astrology consultations.</p>
              <div className="flex gap-3">
                {["📘","🐦","📸","▶️"].map((icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-xl bg-[#faf8f5] border border-[#f5c842]/20 flex items-center justify-center text-base hover:border-[#FF9933]/40 hover:bg-white cursor-pointer transition-all hover:scale-110">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="font-cinzel font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Services</div>
              {["Chat with Astrologer", "Kundali Analysis", "Love & Marriage", "Career Guidance", "Vastu Shastra", "Tarot Reading"].map(l => (
                <div key={l} className="text-slate-500 text-sm mb-2.5 hover:text-[#FF9933] cursor-pointer transition-colors">{l}</div>
              ))}
            </div>

            {/* Company */}
            <div>
              <div className="font-cinzel font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Company</div>
              {["About Us", "Become an Astrologer", "Careers", "Blog", "Press"].map(l => (
                <div key={l} className="text-slate-500 text-sm mb-2.5 hover:text-[#FF9933] cursor-pointer transition-colors">{l}</div>
              ))}
            </div>

            {/* Support */}
            <div>
              <div className="font-cinzel font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Support</div>
              {["Help Center", "Privacy Policy", "Terms of Service", "Refund Policy", "Contact Us"].map(l => (
                <div key={l} className="text-slate-500 text-sm mb-2.5 hover:text-[#FF9933] cursor-pointer transition-colors">{l}</div>
              ))}
              <div className="mt-5 p-3 rounded-2xl bg-[#faf8f5] border border-[#f5c842]/20">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">24/7 Support</div>
                <div className="text-sm font-bold text-slate-700">support@cosmicinsight.in</div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-[#f5c842]/15 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} CosmicInsight. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#f5c842] text-xs">✦</span>
              <span className="font-cinzel font-bold text-slate-600 text-sm">Guided by the Stars</span>
              <span className="text-[#f5c842] text-xs">✦</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-emerald-500 font-bold">●</span> All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
