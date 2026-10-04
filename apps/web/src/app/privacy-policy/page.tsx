import Link from "next/link";

export const metadata = { title: "Privacy Policy – AstroWalla" };

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "Phone number (used as your primary identifier — no email required)",
      "Device information including IP address, browser type, and operating system",
      "Usage data such as pages visited, features used, and session duration",
      "Payment information processed securely via Razorpay (we do not store card details)",
      "Birth profile information you provide: name, date and time of birth, and birthplace",
      "Chat session metadata and conversation content, including messages and images you choose to send; conversations are stored to provide chat history",
      "Notification tokens and device platform when push notifications are enabled",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To provide, maintain, and improve our astrology consultation platform",
      "To process wallet transactions and maintain your account balance",
      "To match you with available astrologers based on your selected filters",
      "To send account notifications via SMS and, when configured and permitted, push notifications via Expo and Google Firebase",
      "To detect and prevent fraudulent activity on our platform",
      "To comply with applicable Indian laws and regulations",
    ],
  },
  {
    title: "3. Data Sharing",
    content: [
      "We do not sell, rent, or trade your personal information to third parties",
      "Your selected astrologer receives the profile information, messages and images needed for your consultation",
      "Payment processing is handled by Razorpay under their privacy policy",
      "We may share anonymized aggregate data for analytics purposes",
      "Data may be disclosed if required by Indian law, court order, or government authority",
    ],
  },
  {
    title: "4. Data Security",
    content: [
      "The deployed app communicates with our API and chat service over HTTPS and secure WebSockets",
      "Payment card information is handled by Razorpay; it is not stored by AstroWalla",
      "Access to your personal data is restricted to authorized personnel only",
      "Contact help.astrowalla@gmail.com to report a security or privacy concern",
    ],
  },
  {
    title: "5. Your Rights",
    content: [
      "Right to access: Request a copy of all data we hold about you",
      "Right to correction: Update inaccurate or incomplete personal data",
      "Right to deletion: Request deletion of your account and associated data",
      "Right to portability: Receive your data in a machine-readable format",
      "To exercise any of these rights, contact us at help.astrowalla@gmail.com",
    ],
  },
  {
    title: "6. Data Retention",
    content: [
      "Account data is retained for the duration of your active account",
      "Chat content, birth details and wallet history are retained while your account is active; no automatic 90-day chat deletion is currently implemented",
      "Deleting your account in the app removes its data from the active application database; backup copies may remain until backups expire",
      "You can also request account deletion at /delete-account without installing or signing into the app; support verifies ownership before acting",
      "Where records must be retained to comply with applicable law, support will explain the required retention",
    ],
  },
  {
    title: "7. Cookies",
    content: [
      "We use essential cookies for authentication and session management",
      "Analytics cookies help us understand how users interact with our platform",
      "You can control cookies through your browser settings",
      "Disabling essential cookies may affect platform functionality",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-extrabold text-stone-900 mb-2">Privacy Policy</h1>
          <p className="text-stone-500 text-sm font-medium">Last updated: 4 October 2026</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 text-sm text-amber-800 font-medium">
          <strong>Summary:</strong> We collect only what is necessary to run the platform. We do not sell your data. Your conversations with astrologers are private. You can delete your account at any time.
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm divide-y divide-stone-50">
          {sections.map(({ title, content }) => (
            <div key={title} className="p-7">
              <h2 className="text-base font-extrabold text-stone-900 mb-4">{title}</h2>
              <ul className="space-y-2.5">
                {content.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5c842] mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
          <h2 className="text-base font-extrabold text-stone-900 mb-2">Contact Our Privacy Team</h2>
          <p className="text-sm text-stone-600 font-medium">
            For any privacy-related queries, write to us at{" "}
            <a href="mailto:help.astrowalla@gmail.com" className="text-[#d97706] font-bold hover:underline">help.astrowalla@gmail.com</a>
            {" "}or reach out through our{" "}
            <Link href="/contact-us" className="text-[#d97706] font-bold hover:underline">Contact page</Link>. To remove your account, visit our <Link href="/delete-account" className="text-[#d97706] font-bold hover:underline">account deletion page</Link>.
          </p>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#f0e6c8] text-center text-xs text-stone-400 font-medium">
        © 2026 AstroWalla. All Rights Reserved.
      </footer>
    </div>
  );
}
