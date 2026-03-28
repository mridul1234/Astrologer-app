import Link from "next/link";

export const metadata = { title: "About Us – AstroWalla" };

const team = [
  { name: "Arjun Sharma", role: "Founder & CEO", initials: "AS", years: 15, expertise: "Vedic Astrology & Numerology" },
  { name: "Priya Nair", role: "Head Astrologer", initials: "PN", years: 20, expertise: "Kundli & Marriage Compatibility" },
  { name: "Rahul Kapoor", role: "CTO", initials: "RK", years: 10, expertise: "Technology & Platform Architecture" },
  { name: "Meena Iyer", role: "Lead Counsellor", initials: "MI", years: 12, expertise: "Tarot & Vastu Shastra" },
];

const milestones = [
  { year: "2020", event: "AstroWalla founded with 5 expert astrologers" },
  { year: "2021", event: "Reached 50,000 users and launched mobile-first platform" },
  { year: "2022", event: "Expanded to 200+ verified astrologers across India" },
  { year: "2023", event: "Introduced live chat consultations and Kundli feature" },
  { year: "2024", event: "Crossed 5 lakh happy customers and 1M+ consultations" },
  { year: "2025", event: "Launched AI-assisted astrological reports and real-time chat" },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_12px_rgba(245,200,66,0.08)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-amber-800 text-lg">☽</span>
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-stone-900 group-hover:text-[#d97706] transition-colors">AstroWalla</div>
              <div className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold">Divine Astrastrowalla</div>
            </div>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-stone-500 hover:text-[#d97706] transition-colors">← Back</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#fef9ec] to-[#fef3c7] border-b border-[#f0e6c8]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#f5c842]/20 border border-[#f5c842]/40 rounded-full px-4 py-1.5 text-[#d97706] text-xs font-bold uppercase tracking-widest mb-6">
            ✦ Our Story
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight mb-4 leading-tight">
            Bridging Ancient Wisdom<br />with Modern Technology
          </h1>
          <p className="text-stone-600 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            AstroWalla was born from a simple belief — every person deserves access to authentic, verified astrology guidance. We connect seekers with India's finest astrologers, anytime, anywhere.
          </p>
          <div className="flex justify-center gap-8 mt-10">
            {[["5L+", "Happy Users"], ["200+", "Expert Astrologers"], ["1M+", "Consultations"], ["4.8★", "Avg Rating"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-extrabold text-stone-900">{val}</div>
                <div className="text-xs font-semibold text-stone-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            { title: "Our Mission", body: "To make authentic Vedic astrology accessible to every Indian household. We rigorously verify every astrologer on our platform — their credentials, experience, and accuracy — so you always get genuine, reliable guidance." },
            { title: "Our Vision", body: "To become India's most trusted astrology platform, blending 5,000 years of Vedic wisdom with cutting-edge technology. We envision a world where cosmic guidance empowers better life decisions for millions." },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 hover:shadow-md transition-shadow">
              <div className="w-10 h-1 bg-gradient-to-r from-[#f5c842] to-[#ffb347] rounded-full mb-5" />
              <h2 className="text-xl font-extrabold text-stone-900 mb-3">{title}</h2>
              <p className="text-stone-600 text-sm leading-relaxed font-medium">{body}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Meet the Team</h2>
          <p className="text-stone-500 text-sm font-medium mb-8">The people who make AstroWalla possible</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {team.map((m) => (
              <div key={m.name} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 text-center hover:shadow-md hover:border-[#f5c842]/30 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#ffb347] flex items-center justify-center text-stone-900 font-extrabold text-xl mx-auto mb-4 shadow-sm">
                  {m.initials}
                </div>
                <div className="font-extrabold text-stone-900 text-sm mb-0.5">{m.name}</div>
                <div className="text-[#d97706] text-xs font-bold mb-2">{m.role}</div>
                <div className="text-stone-500 text-[11px] font-medium leading-snug">{m.expertise}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-2">{m.years}yrs exp</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Our Journey</h2>
          <p className="text-stone-500 text-sm font-medium mb-8">Key milestones since we started</p>
          <div className="relative pl-6 border-l-2 border-[#f5c842]/40 space-y-6">
            {milestones.map((m) => (
              <div key={m.year} className="relative">
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-[#f5c842] border-2 border-white shadow-sm" />
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-[#d97706] uppercase tracking-widest mb-1">{m.year}</div>
                  <div className="text-sm font-semibold text-stone-800">{m.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 AstroWalla. All Rights Reserved.
      </footer>
    </div>
  );
}
