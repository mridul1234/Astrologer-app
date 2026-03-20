import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center text-white px-4">
      <main className="max-w-3xl text-center space-y-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-5xl shadow-xl shadow-purple-500/20 mb-4 animate-pulse">
          🔮
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-100">
          Cosmic Connections
        </h1>
        
        <p className="text-xl md:text-2xl text-purple-200/80 max-w-xl mx-auto leading-relaxed">
          Connect with expert astrologers instantly. Get real-time guidance and clarity for your life's journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full justify-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/20 transform hover:-translate-y-1"
          >
            Log In to Chat
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-semibold text-lg hover:bg-white/20 transition-all transform hover:-translate-y-1"
          >
            Create Account
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-center text-white/40 text-sm">
        <p>Run <strong>npm run dev</strong> to start the platform locally.</p>
        <p className="mt-2 text-xs">For testing, use testuser@example.com and astro@example.com (Password: password123)</p>
      </footer>
    </div>
  );
}
