import Link from "next/link";

const FEATURES = [
  {
    icon: "🪷",
    title: "Vedic Astrology",
    desc: "Ancient wisdom decoded by certified Jyotish practitioners for your life's blueprint.",
  },
  {
    icon: "✨",
    title: "Live Chat Sessions",
    desc: "Real-time, private conversations with your chosen astrologer, anytime you need.",
  },
  {
    icon: "🔱",
    title: "Secure Wallet",
    desc: "Pay-as-you-go with our encrypted wallet. Powered by Razorpay.",
  },
  {
    icon: "⭐",
    title: "Verified Experts",
    desc: "Every astrologer is rigorously vetted for accuracy, expertise, and empathy.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    sign: "♏ Scorpio",
    text: "My astrologer's guidance on my career switch was unnervingly accurate. I'm at my dream job now!",
    rating: 5,
  },
  {
    name: "Rahul M.",
    sign: "♈ Aries",
    text: "Asked about my relationship struggles and got clarity I hadn't found in years of therapy. Truly cosmic.",
    rating: 5,
  },
  {
    name: "Ananya K.",
    sign: "♋ Cancer",
    text: "The Kundali analysis was so detailed and personal. It felt like she already knew my whole life.",
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ zIndex: 1 }}>
      {/* Decorative zodiac rings */}
      <div
        className="zodiac-ring animate-spin-slow"
        style={{ width: 600, height: 600, top: -150, right: -150, opacity: 0.5 }}
      />
      <div
        className="zodiac-ring"
        style={{ width: 400, height: 400, top: -100, right: -100, border: "1px solid rgba(255,153,51,0.1)" }}
      />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        {/* Top nav */}
        <nav className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-float inline-block">✨</span>
            <span
              className="font-cinzel text-xl font-bold tracking-wider"
              style={{ color: "#FF9933" }}
            >
              CosmicChat
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold tracking-widest uppercase text-slate-500 hover:text-[#FF9933] transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="btn-gold text-sm px-6 py-2.5 rounded-full font-bold uppercase tracking-widest shadow-md"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-xs font-extrabold uppercase tracking-widest shadow-sm bg-[#faf8f5]"
            style={{
              border: "1px solid rgba(255,153,51,0.3)",
              color: "#d97706",
            }}
          >
            <span className="animate-twinkle inline-block text-lg">🪷</span>
            India&apos;s Most Trusted Astrology Platform
            <span className="animate-twinkle inline-block text-lg" style={{ animationDelay: "0.5s" }}>🪷</span>
          </div>

          {/* Main heading */}
          <h1 className="font-cinzel text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-slate-800 drop-shadow-sm">The Stars</span>
            <br />
            <span className="text-gold-shimmer">Have Your Answers</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Connect instantly with India&apos;s finest astrologers for personalized guidance on
            love, career, health, and destiny — one conversation at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              id="hero-cta-primary"
              className="btn-gold px-10 py-4 rounded-full font-bold text-lg w-full sm:w-auto shadow-lg"
            >
              ✨ Start Your Journey
            </Link>
            <Link
              href="/login"
              id="hero-cta-secondary"
              className="glass-card px-8 py-4 rounded-full font-bold text-lg hover:border-[#FF9933]/50 transition-all w-full sm:w-auto text-slate-700 hover:text-[#FF9933]"
            >
              Already a member? Sign In
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 p-6 rounded-3xl bg-white/40 border border-white/60 shadow-sm backdrop-blur-sm max-w-3xl mx-auto">
            {[
              { val: "50,000+", label: "Happy Seekers" },
              { val: "200+", label: "Expert Astrologers" },
              { val: "4.9★", label: "Average Rating" },
              { val: "24/7", label: "Always Available" },
            ].map((s) => (
              <div key={s.label} className="text-center px-4">
                <div className="font-cinzel text-3xl font-bold" style={{ color: "#d97706" }}>
                  {s.val}
                </div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating orb */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,153,51,0.12) 0%, transparent 70%)" }}
        />
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Why Choose <span className="text-gold-shimmer">CosmicChat?</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            Ancient wisdom meets modern convenience. Talk to the stars without the hassle.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-3xl p-8 hover:border-[#FF9933]/40 transition-all group hover:-translate-y-2 duration-300"
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                {f.icon}
              </div>
              <h3 className="font-cinzel font-bold text-slate-800 text-lg mb-3 tracking-wide">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative px-4 py-24 max-w-5xl mx-auto text-center">
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-slate-800 mb-16">
          How It <span className="text-gold-shimmer">Works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: "01", title: "Login", desc: "Easily login or create your account in 30 seconds with OTP verification.", icon: "📱" },
            { num: "02", title: "Add Balance", desc: "Top up your wallet securely using Razorpay.", icon: "💳" },
            { num: "03", title: "Start Chatting", desc: "Pick an astrologer and begin your cosmic conversation.", icon: "💬" },
          ].map((step) => (
            <div key={step.num} className="relative">
              <div
                className="glass-card-gold rounded-3xl p-10 relative overflow-hidden hover:-translate-y-2 transition-all duration-300 h-full"
              >
                <div
                  className="font-cinzel text-7xl font-black absolute -top-2 -right-2 opacity-15"
                  style={{ color: "#FF9933" }}
                >
                  {step.num}
                </div>
                <div className="text-4xl mb-6 drop-shadow-sm">{step.icon}</div>
                <h3 className="font-cinzel font-bold text-slate-800 text-xl mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-loose">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            What Seekers <span className="text-gold-shimmer">Say</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="glass-card rounded-3xl p-8 hover:border-[#FF9933]/30 transition-all hover:-translate-y-2 duration-300"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} style={{ color: "#FF9933", fontSize: "1.2rem" }}>★</span>
                ))}
              </div>
              <p className="text-slate-600 font-medium text-[15px] leading-relaxed mb-8 italic">"{t.text}"</p>
              <div className="flex items-center gap-4 border-t border-slate-200 pt-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner"
                  style={{
                    background: "linear-gradient(135deg, #FF9933, #f5c842)",
                    color: "white",
                  }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-slate-800 font-extrabold text-sm tracking-wide">{t.name}</div>
                  <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t.sign}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative px-4 py-24 max-w-4xl mx-auto text-center">
        <div
          className="rounded-[3rem] p-16 shadow-xl relative overflow-hidden bg-white"
          style={{
            border: "1px solid rgba(255,153,51,0.3)",
          }}
        >
          {/* Internal Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF9933]/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#f5c842]/10 rounded-full blur-[60px]" />
          
          <div className="relative z-10">
            <div className="text-6xl mb-6 animate-float inline-block drop-shadow-sm">🪷</div>
            <h2 className="font-cinzel text-4xl font-bold text-slate-800 mb-6 tracking-wide">
              Your Destiny Awaits
            </h2>
            <p className="text-slate-600 text-lg mb-10 font-medium max-w-xl mx-auto leading-relaxed">
              The universe has been waiting to speak to you. Start your first session today.
            </p>
            <Link
              href="/login"
              id="bottom-cta"
              className="btn-gold inline-block px-12 py-5 rounded-full font-extrabold text-lg tracking-wide uppercase shadow-lg shadow-orange-500/20"
            >
              Begin Now ✦
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-slate-200/60 bg-[#faf8f5]/80 backdrop-blur-md">
        <p className="font-cinzel font-bold text-slate-800 text-lg mb-2">
          ✦ CosmicChat · Guided by the Stars ✦
        </p>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} CosmicChat. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

