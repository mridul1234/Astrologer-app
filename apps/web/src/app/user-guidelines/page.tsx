import Link from "next/link";

export const metadata = { title: "User Guidelines – AstroWalla" };

const doList = [
  "Be respectful and courteous to astrologers at all times",
  "Provide accurate birth details (date, time, place) for accurate readings",
  "Start sessions only when you have a stable internet connection",
  "End your session properly using the End Session button",
  "Maintain sufficient wallet balance before starting a consultation",
  "Report any inappropriate astrologer behaviour to our support team",
  "Keep your account credentials secure and do not share them",
];

const dontList = [
  "Share your phone number, email, or WhatsApp with any astrologer",
  "Attempt to contact astrologers outside the AstroWalla platform",
  "Use abusive, threatening, or sexually explicit language in chat",
  "Create multiple accounts to abuse free consultation credits",
  "Record or share screenshots of your private consultation sessions",
  "Harass astrologers for predictions on illegal or harmful activities",
  "Use the platform for any fraudulent or unlawful purpose",
];

const tips = [
  { title: "Prepare Before You Connect", desc: "Have your exact birth date, time, and place of birth ready. The more accurate the details, the more precise the guidance." },
  { title: "Be Clear About Your Question", desc: "Start the session with a specific question or life area you want guidance on — this helps the astrologer give focused insights." },
  { title: "Take Notes", desc: "Jot down important points during the session. Chat transcripts help, but your own notes will anchor the advice better." },
  { title: "Allow Time to Process", desc: "Astrological guidance works best when you reflect on it. Don't rush into decisions immediately after a session." },
  { title: "Follow Up", desc: "If a prediction needs validation over time, reconnect with the same astrologer for continuity of guidance." },
];

export default function UserGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_12px_rgba(245,200,66,0.08)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-amber-800 text-lg">☽</span>
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-stone-900 group-hover:text-[#d97706] transition-colors">AstroWalla</div>
              <div className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold">Divine Astro Insight</div>
            </div>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-stone-500 hover:text-[#d97706] transition-colors">← Back</Link>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-[#fef9ec] to-[#fef3c7] border-b border-[#f0e6c8]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="inline-flex items-center gap-2 bg-[#f5c842]/20 border border-[#f5c842]/40 rounded-full px-4 py-1.5 text-[#d97706] text-xs font-bold uppercase tracking-widest mb-5">
            ✦ Guidelines
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-2">User Guidelines</h1>
          <p className="text-stone-500 text-sm font-medium">For a respectful, safe, and productive experience on AstroWalla</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Do / Don't */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-base font-extrabold text-stone-900">Please Do</h2>
            </div>
            <ul className="space-y-3">
              {doList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-stone-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <h2 className="text-base font-extrabold text-stone-900">Please Don't</h2>
            </div>
            <ul className="space-y-3">
              {dontList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-stone-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Tips for a Great Session</h2>
        <p className="text-stone-500 text-sm font-medium mb-7">Get the most out of your consultations</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {tips.map(({ title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 hover:shadow-md hover:border-[#f5c842]/30 transition-all">
              <div className="w-8 h-1 bg-gradient-to-r from-[#f5c842] to-[#ffb347] rounded-full mb-4" />
              <h3 className="font-extrabold text-stone-900 text-sm mb-2">{title}</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Violations */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
          <h2 className="text-base font-extrabold text-stone-900 mb-5">Consequences of Violation</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { level: "Warning", action: "First violation — official warning sent to your account", cls: "bg-amber-50 border-amber-100 text-amber-700" },
              { level: "Suspension", action: "Repeated violations — temporary account suspension", cls: "bg-orange-50 border-orange-100 text-orange-700" },
              { level: "Ban", action: "Severe or continuing violations — permanent account ban", cls: "bg-red-50 border-red-100 text-red-700" },
            ].map(({ level, action, cls }) => (
              <div key={level} className={`rounded-2xl border p-5 ${cls}`}>
                <div className="font-extrabold text-sm mb-2">{level}</div>
                <p className="text-xs font-medium leading-relaxed opacity-80">{action}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-4">
            All violations are reviewed by our Trust & Safety team. To report an issue, contact{" "}
            <a href="mailto:support@astrowalla.in" className="text-[#d97706] font-bold hover:underline">support@astrowalla.in</a>
          </p>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 AstroWalla. All Rights Reserved.
      </footer>
    </div>
  );
}
