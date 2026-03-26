"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: "Vedic Astrology",
    desc: "Ancient Jyotish wisdom decoded by certified practitioners — Kundali, Dasha, Nakshatras and more.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Live Chat Sessions",
    desc: "Real-time, private consultations with your chosen astrologer. No appointments, just answers.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
      </svg>
    ),
    title: "Secure Wallet",
    desc: "Pay-as-you-go with our encrypted wallet. Add funds in seconds, never charged for waiting.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.18 1.03"/>
        <path d="M16 5l1.5 1.5L21 3"/>
      </svg>
    ),
    title: "Verified Experts",
    desc: "Every astrologer passes a 3-round vetting — written assessment, background check, trial reading.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Honest Reviews",
    desc: "Every rating from a real verified session. No paid reviews, no manipulation.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: "24 / 7 Available",
    desc: "The cosmos never sleeps. Connect with an astrologer any hour — even at 3am when doubt strikes.",
  },
];

const TESTIMONIALS = [
  { name: "Priya S.", city: "Mumbai", sign: "Scorpio", text: "My astrologer's guidance on my career switch was unnervingly accurate. I landed my dream job exactly when predicted.", rating: 5 },
  { name: "Rahul M.", city: "Bangalore", sign: "Aries", text: "I was skeptical at first. After my relationship reading, I got clarity I hadn't found in years of therapy.", rating: 5 },
  { name: "Ananya K.", city: "Delhi", sign: "Cancer", text: "The Kundali analysis was so personal — it felt like she already knew my entire life. Referred 6 friends already.", rating: 5 },
  { name: "Vikram T.", city: "Pune", sign: "Capricorn", text: "Connected at midnight during a panic about my business. The astrologer calmed me, gave me a timeline — every date came true.", rating: 5 },
  { name: "Sneha R.", city: "Chennai", sign: "Virgo", text: "Booked a 10-minute session, stayed for 45. The health insights were spot on. Blown away as a first-time user.", rating: 5 },
  { name: "Arjun P.", city: "Hyderabad", sign: "Aquarius", text: "Best ₹200 I ever spent. The astrologer predicted my promotion month correct to the week. A regular now.", rating: 5 },
];

const FAQS = [
  { q: "How does the chat session work?", a: "After adding funds to your wallet, pick any available astrologer and click 'Chat Now'. You're connected in real-time within seconds. The session is charged per minute — only when the astrologer has joined and you're actively chatting." },
  { q: "What is the minimum recharge amount?", a: "You can add as little as ₹50 to your wallet. Sessions are charged per minute at the astrologer's listed rate, so even a small top-up gets you started with several minutes of guidance." },
  { q: "Are the astrologers verified?", a: "Yes. Every astrologer on CosmicInsight passes a 3-stage vetting: a written Vedic astrology assessment, background check, and a trial reading evaluated by our senior panel. Only the top 15% are onboarded." },
  { q: "What if the astrologer doesn't respond?", a: "You are never charged if the astrologer doesn't join within 10 minutes. The session auto-cancels and your full balance is preserved. You can immediately connect with another astrologer." },
  { q: "Is my conversation private?", a: "Absolutely. All chat sessions are end-to-end encrypted. Your conversations are never shared, sold, or used for any other purpose. You can request data deletion at any time." },
  { q: "Can I get a refund?", a: "If a technical issue prevents a session from starting, we issue a full refund within 24 hours. Once a session has begun and the astrologer has joined, charges apply per the billing policy." },
];

const ASTROLOGERS = [
  { name: "Pandit Ravi Shankar", spec: "Vedic & Kundali Expert", exp: "18 yrs", rate: "₹45/min", rating: "4.9", reviews: "2,341", lang: "Hindi, English" },
  { name: "Astro Kavitha Devi", spec: "Relationship & Tarot", exp: "12 yrs", rate: "₹35/min", rating: "4.8", reviews: "1,876", lang: "Tamil, English" },
  { name: "Guru Anand Joshi", spec: "Career & Finance", exp: "22 yrs", rate: "₹60/min", rating: "5.0", reviews: "4,102", lang: "Hindi, Gujarati" },
];

const STATS = [
  { val: "50,000+", label: "Happy Seekers" },
  { val: "200+", label: "Expert Astrologers" },
  { val: "4.9★", label: "Average Rating" },
  { val: "24/7", label: "Available" },
];

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-[#FF9933]" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-[#FF9933]/30 bg-white shadow-sm" : "border-stone-200 bg-white/50 hover:border-stone-300"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between px-6 py-5 text-left gap-4">
        <span className="font-semibold text-slate-800 text-[15px] leading-snug">{q}</span>
        <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${open ? "border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5" : "border-stone-300 text-stone-400"}`}>
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

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EDE4CE] text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#EDE4CE]/90 backdrop-blur-lg border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF9933] flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">ॐ</span>
            </div>
            <span className="font-cinzel font-black text-slate-900 text-[17px] tracking-wide">CosmicInsight</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#astrologers" className="hover:text-slate-900 transition-colors">Astrologers</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link href="/login" id="nav-cta"
              className="px-5 py-2 rounded-full bg-[#FF9933] text-white font-bold text-sm hover:bg-[#e8891f] transition-colors shadow-sm hover:shadow-md">
              Get Started
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 px-5 py-3 flex flex-col gap-1 bg-[#FDFBF7]">
            {[["How It Works", "#how-it-works"], ["Astrologers", "#astrologers"], ["Reviews", "#testimonials"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-medium text-slate-600 hover:text-[#FF9933] transition-colors">{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-24 text-center">
        {/* Single soft glow — warm, centred, contained */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[640px] h-[640px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,153,51,0.10) 0%, transparent 70%)" }} />
        </div>
        {/* Subtle OM watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
          <span className="font-cinzel font-black text-[#FF9933]" style={{ fontSize: "clamp(160px,35vw,400px)" }}>ॐ</span>
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FF9933]/10 border border-[#FF9933]/25 text-[#c97000] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><polygon points="10 1 12.63 7.18 19.51 7.64 14.5 11.97 16.18 18.64 10 14.9 3.82 18.64 5.5 11.97 .49 7.64 7.37 7.18"/></svg>
            India's Most Trusted Astrology Platform
          </div>

          <h1 className="font-cinzel text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
            The Stars Have<br />
            <span className="text-[#FF9933]">Your Answers</span>
          </h1>

          <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10 font-normal">
            Talk to India's finest Vedic astrologers — live, private, and available right now.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link href="/login" id="hero-cta-primary"
              className="px-9 py-4 rounded-full bg-[#FF9933] text-white font-bold text-base hover:bg-[#e8891f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto">
              Start Your Journey →
            </Link>
            <Link href="/login" id="hero-cta-secondary"
              className="px-7 py-4 rounded-full border border-stone-300 text-slate-600 font-semibold text-base hover:border-stone-400 hover:text-slate-800 transition-all bg-white/80 w-full sm:w-auto">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-2xl px-4 py-4 text-center shadow-sm">
                <div className="font-cinzel font-black text-2xl text-[#FF9933] mb-0.5">{s.val}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-5 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#FF9933] text-xs font-bold uppercase tracking-[0.2em] mb-3">Simple Process</p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-black text-slate-900 mb-3">Start in 3 Steps</h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">From sign-up to cosmic insights in under 2 minutes.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: "01", title: "Create Account", desc: "Enter your number, verify with OTP. No passwords, no forms. Ready in 30 seconds.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg> },
            { num: "02", title: "Add Balance", desc: "Top up via UPI, card, or Net Banking. Start from as low as ₹50.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
            { num: "03", title: "Chat & Get Guided", desc: "Browse verified astrologers, pick your guide, and start your private real-time session.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          ].map((step, i) => (
            <div key={step.num} className="relative bg-white border border-stone-200 rounded-3xl p-8 hover:border-[#FF9933]/40 hover:shadow-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-3 -right-2 font-cinzel font-black text-[72px] text-stone-100 leading-none select-none">{step.num}</div>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] mb-5 group-hover:bg-[#FF9933]/15 transition-colors">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-[#FF9933] uppercase tracking-widest mb-2">Step {step.num}</div>
                <h3 className="font-cinzel font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 py-20 bg-white/95 border-y border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#FF9933] text-xs font-bold uppercase tracking-[0.2em] mb-3">Why CosmicInsight</p>
            <h2 className="font-cinzel text-3xl md:text-4xl font-black text-slate-900 mb-3">Built for Real Results</h2>
            <p className="text-slate-500 text-base max-w-md mx-auto">Everything you need for a meaningful, trustworthy astrology experience.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-stone-200/60 p-7 hover:border-[#FF9933]/30 hover:shadow-md transition-all duration-300 group bg-white">
                <div className="w-11 h-11 rounded-xl bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] mb-5 group-hover:bg-[#FF9933]/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASTROLOGERS ── */}
      <section id="astrologers" className="px-5 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#FF9933] text-xs font-bold uppercase tracking-[0.2em] mb-3">Meet Our Guides</p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-black text-slate-900 mb-3">Featured Astrologers</h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">Handpicked, verified, and trusted by thousands of seekers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ASTROLOGERS.map((a) => {
            const initials = a.name.split(" ").slice(0, 2).map(w => w[0]).join("");
            return (
              <div key={a.name} className="bg-white border border-stone-200 rounded-3xl p-7 hover:border-[#FF9933]/40 hover:shadow-lg transition-all duration-300 flex flex-col">
                {/* Profile */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center font-cinzel font-black text-white text-xl">
                      {initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-[15px] leading-tight">{a.name}</div>
                    <div className="text-xs text-[#FF9933] font-semibold mt-0.5 uppercase tracking-wider">{a.spec}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { l: "Exp", v: a.exp },
                    { l: "Rate", v: a.rate },
                    { l: "Rating", v: a.rating },
                    { l: "Reviews", v: a.reviews },
                  ].map(item => (
                    <div key={item.l} className="text-center rounded-xl bg-stone-50 border border-stone-100 px-2 py-2">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{item.l}</div>
                      <div className="text-[11px] font-bold text-slate-700">{item.v}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 mb-5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>
                  {a.lang}
                </div>

                <Link href="/login" className="mt-auto block w-full py-3 rounded-2xl bg-[#FF9933] text-white text-center font-bold text-sm hover:bg-[#e8891f] transition-colors">
                  Chat Now
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#FF9933] transition-colors border border-stone-200 hover:border-[#FF9933]/40 px-6 py-3 rounded-full bg-white hover:shadow-sm">
            View all astrologers
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="px-5 py-20 bg-white/95 border-y border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#FF9933] text-xs font-bold uppercase tracking-[0.2em] mb-3">Real Stories</p>
            <h2 className="font-cinzel text-3xl md:text-4xl font-black text-slate-900 mb-3">What Seekers Say</h2>
            <p className="text-slate-500 text-base">From 50,000+ verified consultations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-stone-200/60 rounded-2xl p-6 hover:shadow-md hover:border-stone-300/60 transition-all duration-300 flex flex-col">
                <StarRating n={t.rating} />
                <p className="text-slate-600 text-sm leading-relaxed mt-4 mb-6 flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.sign} · {t.city}</div>
                  </div>
                  <div className="ml-auto text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
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
          <p className="text-[#FF9933] text-xs font-bold uppercase tracking-[0.2em] mb-3">Got Questions?</p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-black text-slate-900 mb-3">Frequently Asked</h2>
          <p className="text-slate-500 text-base">Everything you need to know before your first session.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 pb-24 max-w-4xl mx-auto">
        <div className="relative rounded-3xl bg-[#FF9933] px-10 py-16 text-center overflow-hidden">
          {/* Inner warmth glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
          <div className="relative">
            <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mb-4">Begin your journey</p>
            <h2 className="font-cinzel text-3xl md:text-4xl font-black text-white mb-4">Your Destiny Awaits</h2>
            <p className="text-white/80 text-base mb-8 max-w-md mx-auto leading-relaxed">
              50,000 seekers already found their answers. The stars are ready — are you?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" id="bottom-cta"
                className="px-9 py-4 rounded-full bg-white text-[#FF9933] font-bold text-base hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Get Started Free
              </Link>
              <Link href="/login"
                className="px-7 py-4 rounded-full border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-all">
                Browse Astrologers
              </Link>
            </div>
            <p className="mt-6 text-white/50 text-xs">No subscription · Pay per minute · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-300/50 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FF9933] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ॐ</span>
                </div>
                <span className="font-cinzel font-black text-slate-900">CosmicInsight</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">India's most trusted platform for real-time Vedic astrology consultations.</p>
              <div className="flex gap-2.5">
                {[
                  <svg key="fb" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
                  <svg key="tw" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>,
                  <svg key="ig" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
                  <svg key="yt" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                ].map((icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-slate-400 hover:text-[#FF9933] hover:border-[#FF9933]/30 cursor-pointer transition-colors">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-4 text-sm">Services</p>
              {["Chat with Astrologer", "Kundali Analysis", "Love & Marriage", "Career Guidance", "Vastu Shastra", "Tarot Reading"].map(l => (
                <p key={l} className="text-slate-400 text-sm mb-2.5 hover:text-slate-700 cursor-pointer transition-colors">{l}</p>
              ))}
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-4 text-sm">Company</p>
              {["About Us", "Become an Astrologer", "Careers", "Blog", "Press"].map(l => (
                <p key={l} className="text-slate-400 text-sm mb-2.5 hover:text-slate-700 cursor-pointer transition-colors">{l}</p>
              ))}
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-4 text-sm">Support</p>
              {["Help Center", "Privacy Policy", "Terms of Service", "Refund Policy", "Contact Us"].map(l => (
                <p key={l} className="text-slate-400 text-sm mb-2.5 hover:text-slate-700 cursor-pointer transition-colors">{l}</p>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-stone-400 text-xs">© {new Date().getFullYear()} CosmicInsight. All rights reserved.</p>
            <p className="font-cinzel text-xs text-stone-400">✦ Guided by the Stars ✦</p>
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
