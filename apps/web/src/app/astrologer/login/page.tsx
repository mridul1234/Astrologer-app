"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AstrologerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please contact administration.");
      setLoading(false);
    } else {
      router.push("/astrologer");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(to bottom, #0a0815, #05030a)", fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-4xl mb-2">🔮</span>
            <span className="font-cinzel text-xl font-bold text-[#f5c842]">Astrologer Portal</span>
          </Link>
        </div>

        <div className="bg-[#110e20] border border-[#f5c842]/20 rounded-3xl p-8">
          <h1 className="text-2xl font-cinzel font-bold text-white mb-6">Staff Login</h1>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#f5c842]/50 focus:outline-none"
                placeholder="yours@cosmic.chat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#f5c842]/50 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f5c842] hover:bg-[#ffe175] text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
