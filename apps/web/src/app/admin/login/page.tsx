"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
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
      setError("Invalid administrator credentials.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(to bottom, #000000, #111)", fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-4xl mb-2">👑</span>
            <span className="font-cinzel text-xl font-bold text-white">Admin Command Center</span>
          </Link>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-cinzel font-bold text-white mb-6">System Access</h1>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Master Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Authorize"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
