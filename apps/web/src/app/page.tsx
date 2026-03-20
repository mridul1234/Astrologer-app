import Link from "next/link";

const FEATURES = [
  {
    icon: "🌙",
    title: "Vedic Astrology",
    desc: "Ancient wisdom decoded by certified Jyotish practitioners for your life's blueprint.",
  },
  {
    icon: "💫",
    title: "Live Chat Sessions",
    desc: "Real-time, private conversations with your chosen astrologer, anytime you need.",
  },
  {
    icon: "🪬",
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
        style={{ width: 400, height: 400, top: -100, right: -100, border: "1px solid rgba(245,200,66,0.08)" }}
      />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        {/* Top nav */}
        <nav className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-float inline-block">🔮</span>
            <span
              className="font-cinzel text-xl font-bold"
              style={{ color: "#f5c842" }}
            >
              CosmicChat
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-purple-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-gold text-sm px-5 py-2.5 rounded-xl font-semibold"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{
              background: "rgba(245,200,66,0.1)",
              border: "1px solid rgba(245,200,66,0.25)",
              color: "#f5c842",
            }}
          >
            <span className="animate-twinkle inline-block">✦</span>
            India&apos;s Most Trusted Astrology Platform
            <span className="animate-twinkle inline-block" style={{ animationDelay: "0.5s" }}>✦</span>
          </div>

          {/* Main heading */}
          <h1 className="font-cinzel text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-white">The Stars</span>
            <br />
            <span className="text-gold-shimmer">Have Your Answers</span>
          </h1>

          <p className="text-lg md:text-xl text-purple-200/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Connect instantly with India&apos;s finest astrologers for personalized guidance on
            love, career, health, and destiny — one conversation at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              id="hero-cta-primary"
              className="btn-gold px-8 py-4 rounded-2xl font-bold text-lg w-full sm:w-auto"
            >
              🔮 Start Your Journey
            </Link>
            <Link
              href="/login"
              id="hero-cta-secondary"
              className="glass-card px-8 py-4 rounded-2xl font-semibold text-lg text-white hover:bg-white/10 transition-all w-full sm:w-auto"
            >
              Already a member? Sign In
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { val: "50,000+", label: "Happy Seekers" },
              { val: "200+", label: "Expert Astrologers" },
              { val: "4.9★", label: "Average Rating" },
              { val: "24/7", label: "Always Available" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-cinzel text-2xl font-bold" style={{ color: "#f5c842" }}>
                  {s.val}
                </div>
                <div className="text-purple-300/60 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating orb */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }}
        />
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="text-gold-shimmer">CosmicChat?</span>
          </h2>
          <p className="text-purple-300/60 max-w-xl mx-auto">
            Ancient wisdom meets modern convenience. Talk to the stars without the hassle.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-6 hover:border-yellow-500/20 transition-all group hover:-translate-y-1 duration-300"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="font-cinzel font-bold text-white mb-2">{f.title}</h3>
              <p className="text-purple-300/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative px-4 py-20 max-w-4xl mx-auto text-center">
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-14">
          How It <span className="text-gold-shimmer">Works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: "01", title: "Sign Up", desc: "Create your account in 30 seconds with OTP verification.", icon: "📱" },
            { num: "02", title: "Add Balance", desc: "Top up your wallet securely using Razorpay.", icon: "💳" },
            { num: "03", title: "Start Chatting", desc: "Pick an astrologer and begin your cosmic conversation.", icon: "💬" },
          ].map((step) => (
            <div key={step.num} className="relative">
              <div
                className="glass-card-gold rounded-2xl p-8 relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="font-cinzel text-6xl font-black absolute top-2 right-4 opacity-10"
                  style={{ color: "#f5c842" }}
                >
                  {step.num}
                </div>
                <div className="text-3xl mb-4">{step.icon}</div>
                <h3 className="font-cinzel font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-purple-300/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
            What Seekers <span className="text-gold-shimmer">Say</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="glass-card rounded-2xl p-7 hover:border-purple-500/20 transition-all hover:-translate-y-1 duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} style={{ color: "#f5c842" }}>★</span>
                ))}
              </div>
              <p className="text-purple-200/80 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #d97706)",
                    color: "white",
                  }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t.name}</div>
                  <div className="text-purple-400 text-xs">{t.sign}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative px-4 py-20 max-w-3xl mx-auto text-center">
        <div
          className="rounded-3xl p-12"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(245,200,66,0.08))",
            border: "1px solid rgba(245,200,66,0.15)",
          }}
        >
          <div className="text-5xl mb-5 animate-float inline-block">🔭</div>
          <h2 className="font-cinzel text-3xl font-bold text-white mb-4">
            Your Destiny Awaits
          </h2>
          <p className="text-purple-200/60 mb-8">
            The universe has been waiting to speak to you. Start your first session today.
          </p>
          <Link
            href="/signup"
            id="bottom-cta"
            className="btn-gold inline-block px-10 py-4 rounded-2xl font-bold text-xl"
          >
            Begin Now ✦
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-500/40 text-sm border-t border-white/5">
        <p className="font-cinzel">
          ✦ CosmicChat · Guided by the Stars ✦
        </p>
        <p className="mt-2 text-xs">
          © {new Date().getFullYear()} CosmicChat. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
