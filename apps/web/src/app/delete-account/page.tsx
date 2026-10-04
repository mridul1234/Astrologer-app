import Link from "next/link";

export const metadata = { title: "Delete Your Account | AstroWalla" };

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12 text-stone-800">
      <Link href="/" className="font-bold">AstroWalla</Link>
      <h1 className="mb-6 mt-10 text-3xl font-bold">Delete your AstroWalla account</h1>
      <p className="mb-6">In the AstroWalla user app, open Profile, then Settings, then Delete my account. Finish or cancel any active consultation first.</p>
      <h2 className="mb-3 text-xl font-bold">Request deletion without the app</h2>
      <p className="mb-4">Send a deletion request to help.astrowalla@gmail.com with the phone number used for your AstroWalla account. Do not send passwords, payment details or an OTP. We will verify account ownership before processing your request.</p>
      <a className="inline-block rounded-lg bg-amber-400 px-5 py-3 font-bold" href="mailto:help.astrowalla@gmail.com?subject=AstroWalla%20account%20deletion%20request">Request account deletion</a>
      <h2 className="mb-3 mt-8 text-xl font-bold">What is deleted</h2>
      <p>Your user account, birth details, reviews, chat sessions and associated messages, wallet history and notification tokens are removed from the active application database. Deletion is permanent. Contact support about any remaining wallet balance before requesting deletion.</p>
      <p className="mt-4">Copies may remain in backups until they expire, or where retention is legally required. Support will explain any required retention when processing a request.</p>
      <Link href="/privacy-policy" className="mt-8 inline-block underline">Read the Privacy Policy</Link>
    </main>
  );
}
