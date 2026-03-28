import Link from "next/link";

export const metadata = { title: "Contact Us – AstroWalla" };

export default function ContactUsPage() {
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
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#f5c842]/20 border border-[#f5c842]/40 rounded-full px-4 py-1.5 text-[#d97706] text-xs font-bold uppercase tracking-widest mb-5">
            ✦ Get in Touch
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-3">We're Here to Help</h1>
          <p className="text-stone-600 text-base font-medium max-w-xl mx-auto">
            Have a question about our services, your account, or anything else? Our support team is available 7 days a week.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
              title: "Email Support",
              value: "support@astrowalla.in",
              sub: "Response within 24 hours",
              href: "mailto:support@astrowalla.in",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>,
              title: "Phone Support",
              value: "+91 1800-123-4567",
              sub: "Mon–Sat, 9 AM – 9 PM IST",
              href: "tel:+911800123456",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
              title: "Live Chat",
              value: "Chat with us instantly",
              sub: "Available 24/7 on the app",
              href: "/dashboard",
            },
          ].map(({ icon, title, value, sub, href }) => (
            <a key={title} href={href} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 text-center hover:shadow-md hover:border-[#f5c842]/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#ffb347] flex items-center justify-center text-stone-900 mx-auto mb-4 shadow-sm group-hover:scale-105 transition-transform">
                {icon}
              </div>
              <h3 className="font-extrabold text-stone-900 mb-1">{title}</h3>
              <div className="text-sm font-bold text-[#d97706] mb-1">{value}</div>
              <div className="text-xs text-stone-400 font-medium">{sub}</div>
            </a>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 md:p-10 max-w-2xl mx-auto">
          <h2 className="text-xl font-extrabold text-stone-900 mb-1">Send Us a Message</h2>
          <p className="text-stone-500 text-sm font-medium mb-7">We typically respond within one business day</p>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Name</label>
                <input readOnly placeholder="Your full name" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#fdfaf5] text-sm font-medium text-stone-700 placeholder:text-stone-300 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Phone</label>
                <input readOnly placeholder="Your phone number" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#fdfaf5] text-sm font-medium text-stone-700 placeholder:text-stone-300 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Subject</label>
              <input readOnly placeholder="What is this regarding?" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#fdfaf5] text-sm font-medium text-stone-700 placeholder:text-stone-300 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Message</label>
              <textarea readOnly rows={4} placeholder="Describe your query in detail..." className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#fdfaf5] text-sm font-medium text-stone-700 placeholder:text-stone-300 cursor-not-allowed resize-none" />
            </div>
            <div className="text-center pt-1">
              <div className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm opacity-60 cursor-not-allowed">
                Send Message (Coming Soon)
              </div>
              <p className="text-xs text-stone-400 mt-3">For urgent queries please email us directly at support@astrowalla.in</p>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white rounded-3xl border border-stone-100 shadow-sm p-8 text-center">
          <h3 className="font-extrabold text-stone-900 text-base mb-2">Head Office</h3>
          <p className="text-stone-600 text-sm font-medium">
            AstroWalla Technologies Pvt. Ltd.<br />
            Level 5, Prestige Tech Park, Outer Ring Road,<br />
            Bengaluru, Karnataka — 560 103, India
          </p>
          <div className="text-xs text-stone-400 font-medium mt-3">GST: 29AABCC1234D1Z5 &nbsp;·&nbsp; CIN: U72900KA2020PTC123456</div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 AstroWalla. All Rights Reserved.
      </footer>
    </div>
  );
}
