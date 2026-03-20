"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    // Auto-login after signup
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Account created but login failed. Please sign in.");
      router.push("/login");
    } else {
      router.push(form.role === "ASTROLOGER" ? "/astrologer" : "/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-3xl font-bold text-white">Join AstroChat</h1>
          <p className="text-purple-300 mt-1 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition"
              placeholder="Raj Kumar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition"
              placeholder="Min. 6 characters"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {["USER", "ASTROLOGER"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("role", r)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    form.role === r
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40"
                      : "bg-white/5 border-white/20 text-purple-300 hover:bg-white/10"
                  }`}
                >
                  {r === "USER" ? "👤 User" : "🔮 Astrologer"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 px-4 py-2 rounded-lg border border-red-800/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 transition-all duration-200 shadow-lg shadow-purple-900/40"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-purple-300 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-white font-medium transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
