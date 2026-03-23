"use client";

import Link from "next/link";

export default function UserFooter() {
  return (
    <footer className="mt-auto w-full" style={{ background: "linear-gradient(180deg, #fffdf8 0%, #fdf6e3 100%)", borderTop: "1px solid #f0e6c8" }}>
      {/* Main Footer Grid */}
      <div className="max-w-[1400px] mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-md border-2 border-[#f0c842]/40 shrink-0 p-1 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800 opacity-80 animate-[spin_40s_linear_infinite]">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <path d="M50 4 L50 96 M4 50 L96 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.8"/>
                  <text x="50" y="20" fontSize="10" textAnchor="middle" fill="currentColor">♈</text>
                  <text x="80" y="54" fontSize="10" textAnchor="middle" fill="currentColor">♋</text>
                  <text x="50" y="88" fontSize="10" textAnchor="middle" fill="currentColor">♎</text>
                  <text x="20" y="54" fontSize="10" textAnchor="middle" fill="currentColor">♑</text>
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-2xl text-stone-900 tracking-tight leading-none">CosmicInsight</div>
                <div className="text-[10px] uppercase tracking-widest text-[#d97706] font-bold mt-1">Divine Astro Insight</div>
              </div>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed max-w-sm mb-6 font-medium">
              CosmicInsight is your trusted platform for authentic astrology consultations. Connect with verified astrologers and get guidance for all aspects of your life through chat, call, or video consultations.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 mb-6">
              {[
                { icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z", label: "Facebook" },
                { icon: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 20.5h9a5 5 0 005-5v-9a5 5 0 00-5-5h-9a5 5 0 00-5 5v9a5 5 0 005 5z", label: "Instagram" },
                { icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z", label: "Twitter" },
                { icon: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z", label: "YouTube" },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#FF9933] hover:border-[#FF9933]/40 hover:shadow-md transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon}/>
                  </svg>
                </button>
              ))}
            </div>

            <a href="mailto:support@cosmicinsight.in" className="flex items-center gap-2 text-stone-600 hover:text-[#FF9933] transition-colors text-sm font-semibold group">
              <svg className="w-4 h-4 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              support@cosmicinsight.in
            </a>
          </div>

          {/* Col 2: About Us */}
          <div>
            <h3 className="font-extrabold text-stone-900 text-base mb-5 tracking-tight relative">
              About Us
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f5c842] rounded-full block"></span>
            </h3>
            <ul className="space-y-3 mt-4">
              {["About Us", "Contact Us", "Product Details"].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(/ /g, "-").replace(/&/g, "and")}`} className="text-stone-600 hover:text-[#FF9933] text-sm font-medium transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-[#f5c842] group-hover:w-3 transition-all duration-200 shrink-0"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h3 className="font-extrabold text-stone-900 text-base mb-5 tracking-tight relative">
              Legal
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f5c842] rounded-full block"></span>
            </h3>
            <ul className="space-y-3 mt-4">
              {["Privacy Policy", "Terms & Conditions", "Refund & Cancellation", "User Guidelines"].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(/ /g, "-").replace(/&/g, "and")}`} className="text-stone-600 hover:text-[#FF9933] text-sm font-medium transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-[#f5c842] group-hover:w-3 transition-all duration-200 shrink-0"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: "1px solid #e9d9b0" }} className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-stone-400 font-semibold tracking-wide">
          © 2026 CosmicInsight. All Rights Reserved. Made with 🌟 in India.
        </span>
        <div className="flex items-center gap-2 text-xs text-stone-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          All systems operational
        </div>
      </div>
    </footer>
  );
}
