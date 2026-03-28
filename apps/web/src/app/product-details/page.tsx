import Link from "next/link";

export const metadata = { title: "Product Details – AstroWalla" };

const features = [
  { icon: "💬", title: "Live Chat Consultations", desc: "Connect with astrologers instantly via real-time text chat. Sessions are billed per minute — you only pay for what you use. End any time." },
  { icon: "🔮", title: "Free Kundli Generation", desc: "Get your complete Vedic birth chart (Kundli) instantly with planetary positions, house analysis, Dasha periods, and more — completely free." },
  { icon: "✅", title: "Verified Astrologers", desc: "Every astrologer on AstroWalla goes through a rigorous 3-step verification: credential check, accuracy test, and live quality assessment." },
  { icon: "💰", title: "Prepaid Wallet System", desc: "Add money to your AstroWalla wallet and use it seamlessly across sessions. Secure payments via Razorpay with instant refunds." },
  { icon: "⏱️", title: "Real-Time Session Billing", desc: "Pay only for the exact time you spend — billed by the minute. Sessions start and end with a single tap. Full session history available." },
  { icon: "🔒", title: "100% Private & Secure", desc: "All conversations are end-to-end encrypted. Your personal information is never shared with anyone — not even the astrologer you speak with." },
];

const plans = [
  { name: "Pay Per Minute", price: "From ₹10/min", desc: "No subscription. Connect with any available astrologer and pay only for time used. Best for occasional users.", highlight: false },
  { name: "Starter Pack", price: "₹199 Wallet Credit", desc: "Add ₹199 to your wallet and get 10% bonus credits. Great for your first consultation.", highlight: false },
  { name: "Power Pack", price: "₹999 Wallet Credit", desc: "Add ₹999 to your wallet and get 20% bonus credits. Most popular choice for regular users.", highlight: true },
  { name: "Premium Pack", price: "₹2999 Wallet Credit", desc: "Add ₹2,999 and receive 30% bonus credits. Best value for power users and long-term guidance.", highlight: false },
];

export default function ProductDetailsPage() {
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
              <div className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold">Divine Astrastrowalla</div>
            </div>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-stone-500 hover:text-[#d97706] transition-colors">← Back</Link>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-[#fef9ec] to-[#fef3c7] border-b border-[#f0e6c8]">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#f5c842]/20 border border-[#f5c842]/40 rounded-full px-4 py-1.5 text-[#d97706] text-xs font-bold uppercase tracking-widest mb-5">
            ✦ Platform Features
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-3">Everything AstroWalla Offers</h1>
          <p className="text-stone-600 text-base font-medium max-w-xl mx-auto">
            A complete astrology experience — from instant consultations to in-depth Kundli readings, all in one place.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* Features grid */}
        <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Core Features</h2>
        <p className="text-stone-500 text-sm font-medium mb-8">What makes AstroWalla the best choice for astrology guidance</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-16">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md hover:border-[#f5c842]/30 transition-all group">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-extrabold text-stone-900 mb-2 text-sm group-hover:text-[#d97706] transition-colors">{title}</h3>
              <p className="text-stone-500 text-xs font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Wallet plans */}
        <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Wallet Recharge Plans</h2>
        <p className="text-stone-500 text-sm font-medium mb-8">Choose the plan that suits your consultation frequency</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {plans.map(({ name, price, desc, highlight }) => (
            <div key={name} className={`rounded-3xl border p-6 transition-all ${highlight ? "bg-gradient-to-br from-[#f5c842] to-[#ffb347] border-[#f5c842] shadow-lg shadow-amber-200/50" : "bg-white border-stone-100 shadow-sm hover:shadow-md hover:border-[#f5c842]/30"}`}>
              {highlight && <div className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-3">⭐ Most Popular</div>}
              <div className={`font-extrabold text-lg mb-1 ${highlight ? "text-stone-900" : "text-stone-900"}`}>{name}</div>
              <div className={`font-extrabold text-base mb-3 ${highlight ? "text-stone-800" : "text-[#d97706]"}`}>{price}</div>
              <p className={`text-xs font-medium leading-relaxed ${highlight ? "text-stone-700" : "text-stone-500"}`}>{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-stone-900 mb-2">How It Works</h2>
          <p className="text-stone-500 text-sm font-medium mb-8">Getting started is simple</p>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Login", desc: "Access your account or create a new one with just your phone number — no email required." },
              { step: "02", title: "Add Wallet Balance", desc: "Recharge your AstroWalla wallet with any amount starting from ₹50." },
              { step: "03", title: "Choose an Astrologer", desc: "Browse verified astrologers filtered by speciality, rating, and language." },
              { step: "04", title: "Start Chatting", desc: "Begin your live chat session and get guidance. End whenever you want." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl font-extrabold text-[#f5c842]/60 mb-2">{step}</div>
                <div className="font-extrabold text-stone-900 mb-2 text-sm">{title}</div>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">{desc}</p>
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
