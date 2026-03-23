import Link from "next/link";

export const metadata = { title: "Refund & Cancellation – CosmicInsight" };

const scenarios = [
  { case: "Technical failure during session", outcome: "Full refund of session cost", eligible: true },
  { case: "Session ended by astrologer unexpectedly", outcome: "Partial refund for unused time", eligible: true },
  { case: "Double charge / payment error", outcome: "Full refund within 3-5 business days", eligible: true },
  { case: "Unsatisfied with consultation quality", outcome: "Reviewed case by case (contact support)", eligible: true },
  { case: "Changed your mind after session", outcome: "Not eligible — session already completed", eligible: false },
  { case: "Wallet balance withdrawal", outcome: "Not eligible — wallet is non-refundable", eligible: false },
  { case: "Request after 7 days of transaction", outcome: "Not eligible — outside refund window", eligible: false },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-stone-800">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#f0e6c8] shadow-[0_2px_12px_rgba(245,200,66,0.08)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#ffce4b] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-amber-800 text-lg">☽</span>
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-stone-900 group-hover:text-[#d97706] transition-colors">CosmicInsight</div>
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
          <h1 className="text-4xl font-extrabold text-stone-900 mb-2">Refund &amp; Cancellation</h1>
          <p className="text-stone-500 text-sm font-medium">Last updated: 1 January 2026</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Refund Window", value: "7 Days", sub: "from transaction date" },
            { label: "Processing Time", value: "3–5 Business Days", sub: "once approved" },
            { label: "Refund Method", value: "Wallet Credit", sub: "or original payment source" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{label}</div>
              <div className="text-xl font-extrabold text-stone-900">{value}</div>
              <div className="text-xs text-stone-500 font-medium mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Eligibility table */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden mb-10">
          <div className="px-7 py-5 border-b border-stone-100">
            <h2 className="text-base font-extrabold text-stone-900">Refund Eligibility</h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Common scenarios and whether they qualify</p>
          </div>
          <div className="divide-y divide-stone-50">
            <div className="grid grid-cols-[3fr_2fr_1fr] px-7 py-3 bg-stone-50 text-[11px] font-bold uppercase tracking-widest text-stone-400">
              <span>Scenario</span>
              <span>Outcome</span>
              <span className="text-center">Eligible</span>
            </div>
            {scenarios.map(({ case: c, outcome, eligible }) => (
              <div key={c} className="grid grid-cols-[3fr_2fr_1fr] px-7 py-4 items-center hover:bg-amber-50/30 transition-colors">
                <span className="text-sm font-semibold text-stone-700">{c}</span>
                <span className="text-sm font-medium text-stone-500">{outcome}</span>
                <div className="flex justify-center">
                  {eligible ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Yes</span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">No</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-7 mb-8">
          <h2 className="text-base font-extrabold text-stone-900 mb-5">How to Request a Refund</h2>
          <div className="space-y-4">
            {[
              { step: "1", text: "Email us at support@cosmicinsight.in with subject line: \"Refund Request — [Transaction ID]\"" },
              { step: "2", text: "Include your registered phone number, the transaction date, and a brief description of the issue" },
              { step: "3", text: "Our team will acknowledge your request within 24 hours and investigate the matter" },
              { step: "4", text: "If approved, the refund is credited to your CosmicInsight Wallet within 3–5 business days" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f5c842] to-[#ffb347] flex items-center justify-center text-stone-900 font-extrabold text-xs shrink-0 shadow-sm">
                  {step}
                </div>
                <p className="text-sm font-medium text-stone-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 font-medium">
          <strong>Note:</strong> Wallet balance recharges are final and non-refundable to your original payment method. They remain in your wallet and can be used for any future consultation on our platform.
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 CosmicInsight. All Rights Reserved.
      </footer>
    </div>
  );
}
