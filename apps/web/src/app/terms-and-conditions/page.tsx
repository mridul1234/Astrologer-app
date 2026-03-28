import Link from "next/link";

export const metadata = { title: "Terms & Conditions – AstroWalla" };

const clauses = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using AstroWalla, you agree to be bound by these Terms and Conditions and all applicable Indian laws. If you do not agree with any of these terms, you may not use the platform. We reserve the right to update these terms at any time with reasonable notice.",
  },
  {
    title: "2. Eligibility",
    content: "You must be at least 18 years of age to use AstroWalla. By using this platform, you confirm that you are 18 or older and have the legal capacity to enter into a binding agreement. The platform is intended for users located in India.",
  },
  {
    title: "3. Nature of Services",
    content: "AstroWalla provides a marketplace platform connecting users with independent astrologers. The consultations are for entertainment and guidance purposes only. AstroWalla does not endorse or guarantee the accuracy of any astrological predictions made by astrologers on the platform.",
  },
  {
    title: "4. Wallet & Payments",
    content: "The AstroWalla Wallet is a prepaid balance used exclusively within the platform. Wallet top-ups are processed via Razorpay and are non-transferable. Sessions are billed per minute at the rate displayed on each astrologer's profile. All prices are in Indian Rupees (INR) and inclusive of applicable taxes.",
  },
  {
    title: "5. Refund Policy",
    content: "Wallet balances are non-refundable except in cases of technical errors or double charges verified by our team. Session charges once deducted are final unless there was a technical fault on our side. Refund requests must be submitted within 7 days of the disputed transaction via support@astrowalla.in.",
  },
  {
    title: "6. User Conduct",
    content: "Users must not engage in abusive, harassing, or inappropriate behavior toward astrologers. Sharing contact information including phone numbers or social media handles with astrologers violates our policy and may result in account suspension. The platform must not be used for any unlawful purpose.",
  },
  {
    title: "7. Astrologer Relationship",
    content: "Astrologers on AstroWalla are independent service providers, not employees or agents of AstroWalla Technologies Pvt. Ltd. AstroWalla acts as an intermediary facilitating the connection. AstroWalla is not liable for the accuracy, quality, or outcomes of any astrological consultation.",
  },
  {
    title: "8. Intellectual Property",
    content: "All content on the AstroWalla platform including logos, text, design, and software is owned by or licensed to AstroWalla Technologies Pvt. Ltd. You may not reproduce, distribute, or create derivative works without written permission.",
  },
  {
    title: "9. Limitation of Liability",
    content: "AstroWalla shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you shall not exceed the wallet balance held in your account at the time of the claim.",
  },
  {
    title: "10. Governing Law",
    content: "These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India. These terms were last updated on 1st January 2026.",
  },
];

export default function TermsPage() {
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
            ✦ Legal
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-stone-500 text-sm font-medium">Last updated: 1 January 2026</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 text-sm text-amber-800 font-medium">
          Please read these terms carefully before using AstroWalla. By using the platform you agree to these terms in full.
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm divide-y divide-stone-50">
          {clauses.map(({ title, content }) => (
            <div key={title} className="p-7">
              <h2 className="text-base font-extrabold text-stone-900 mb-3">{title}</h2>
              <p className="text-sm text-stone-600 font-medium leading-relaxed">{content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
          <h2 className="text-base font-extrabold text-stone-900 mb-2">Questions About These Terms?</h2>
          <p className="text-sm text-stone-600 font-medium">
            Contact us at{" "}
            <a href="mailto:legal@astrowalla.in" className="text-[#d97706] font-bold hover:underline">legal@astrowalla.in</a>
          </p>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 AstroWalla. All Rights Reserved.
      </footer>
    </div>
  );
}
