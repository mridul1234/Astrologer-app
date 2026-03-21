"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp" | "loading">("form");
  const [form, setForm] = useState({ name: "", phone: "", role: "USER" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (form.phone.length < 10) { setError("Please enter a valid 10-digit number."); return; }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("otp");
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`sotp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`sotp-${index - 1}`)?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit OTP."); return; }
    if (code === "000000") { setError("Invalid OTP."); return; }
    setError("");
    setLoading(true);
    setStep("loading");
    await new Promise((r) => setTimeout(r, 1000));
    
    const res = await signIn("OTP", {
      phone: form.phone,
      role: form.role,
      name: form.name,
      callbackUrl: "/dashboard",
    });

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-center">
          <div className="text-6xl animate-float mb-6">✨</div>
          <p className="font-cinzel text-xl text-white mb-2">Creating Your Cosmic Profile…</p>
          <p className="text-purple-300/60 text-sm">Reading the stars just for you</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl animate-float inline-block">🔮</span>
            <span className="font-cinzel text-xl font-bold" style={{ color: "#f5c842" }}>
              CosmicChat
            </span>
          </Link>
        </div>

        <div
          className="glass-card rounded-3xl px-8 py-10"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.08)" }}
        >
          {step === "form" && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🌟</div>
                <h1 className="font-cinzel text-2xl font-bold text-white">Begin Your Journey</h1>
                <p className="text-purple-300/60 mt-2 text-sm">
                  Create your account and unlock cosmic guidance
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/80 mb-2">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                    className="cosmic-input w-full px-4 py-3.5 rounded-xl text-base"
                    placeholder="Raj Kumar"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/80 mb-2">Mobile Number</label>
                  <div className="flex gap-2">
                    <div
                      className="flex items-center px-3 rounded-xl text-sm font-medium text-purple-300"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        minWidth: "60px",
                        justifyContent: "center",
                      }}
                    >
                      🇮🇳 +91
                    </div>
                    <input
                      id="signup-phone"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                      className="cosmic-input flex-1 px-4 py-3.5 rounded-xl text-base"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/80 mb-3">I am a…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "USER", label: "Seeker", icon: "🙏", desc: "Looking for guidance" },
                      { val: "ASTROLOGER", label: "Astrologer", icon: "🔮", desc: "Offer readings" },
                    ].map((r) => (
                      <button
                        key={r.val}
                        type="button"
                        id={`role-${r.val.toLowerCase()}`}
                        onClick={() => update("role", r.val)}
                        className={`py-4 px-3 rounded-2xl border text-sm font-medium transition-all text-left ${
                          form.role === r.val
                            ? "border-yellow-500/40 text-white"
                            : "text-purple-300/70 hover:bg-white/5"
                        }`}
                        style={
                          form.role === r.val
                            ? {
                                background: "linear-gradient(135deg, rgba(245,200,66,0.12), rgba(124,58,237,0.12))",
                                boxShadow: "0 0 20px rgba(245,200,66,0.1)",
                                border: "1px solid rgba(245,200,66,0.3)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }
                        }
                      >
                        <div className="text-2xl mb-1">{r.icon}</div>
                        <div className="font-semibold text-white">{r.label}</div>
                        <div className="text-xs opacity-60 mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
                >
                  {loading ? "Sending OTP…" : "Create Account ✦"}
                </button>
              </form>

              <p className="text-center text-purple-300/60 text-sm mt-6">
                Already have an account?{" "}
                <Link href="/login" className="font-medium hover:text-white transition-colors" style={{ color: "#f5c842" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📲</div>
                <h1 className="font-cinzel text-2xl font-bold text-white">Verify Your Number</h1>
                <p className="text-purple-300/60 mt-2 text-sm">
                  OTP sent to <span className="text-purple-200 font-medium">+91 {form.phone}</span>
                </p>
                <button
                  onClick={() => { setStep("form"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-xs mt-1 transition-colors"
                  style={{ color: "#f5c842" }}
                >
                  Change number
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center gap-2.5">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`sotp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="otp-input"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && (
                  <div
                    className="text-sm px-4 py-3 rounded-xl text-center"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  id="verify-signup-otp-btn"
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
                >
                  {loading ? "Verifying…" : "Verify & Continue ✦"}
                </button>

                <div className="text-center text-sm text-purple-300/60">
                  {resendTimer > 0 ? (
                    <span>Resend in <span className="text-white font-medium">{resendTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      className="font-medium hover:text-white transition-colors"
                      style={{ color: "#f5c842" }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>

              <div
                className="mt-6 px-4 py-3 rounded-xl text-center text-xs"
                style={{
                  background: "rgba(245,200,66,0.06)",
                  border: "1px solid rgba(245,200,66,0.15)",
                  color: "rgba(253,230,138,0.7)",
                }}
              >
                🧪 Demo mode: enter any 6-digit OTP (except 000000) to continue
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 text-purple-500/30 text-xs font-cinzel">
          ✦ Protected by CosmicChat Security ✦
        </div>
      </div>
    </div>
  );
}
