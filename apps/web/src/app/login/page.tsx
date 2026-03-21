"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

type Step = "phone" | "otp" | "loading";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);

    // Dummy OTP send — replace with real API later
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("otp");
    setResendTimer(30);
    // Focus first OTP input
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);

    // Dummy verification — accept any 6-digit OTP
    // In production: call your real OTP API here
    await new Promise((r) => setTimeout(r, 1200));

    if (code === "000000") {
      setError("Invalid OTP. Please try again.");
      setLoading(false);
      return;
    }

    // Simulate API delay for UI effect
    setStep("loading");
    await new Promise((r) => setTimeout(r, 800));

    // NextAuth Sign In with phone OTP mock flow
    await signIn("credentials", {
      phone,
      callbackUrl: "/dashboard",
    });
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-center">
          <div className="text-6xl animate-float mb-6">🔮</div>
          <p className="font-cinzel text-xl text-white mb-2">Aligning the Stars…</p>
          <p className="text-purple-300/60 text-sm">Preparing your cosmic dashboard</p>
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
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
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
          {step === "phone" && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📱</div>
                <h1 className="font-cinzel text-2xl font-bold text-white">Welcome Back</h1>
                <p className="text-purple-300/60 mt-2 text-sm">
                  Enter your mobile number to receive a one-time passcode
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-purple-200/80 mb-2">
                    Mobile Number
                  </label>
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
                      id="phone-input"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                      className="cosmic-input flex-1 px-4 py-3.5 rounded-xl text-base"
                      placeholder="98765 43210"
                      autoFocus
                    />
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
                  id="send-otp-btn"
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
                >
                  {loading ? "Sending OTP…" : "Send OTP ✦"}
                </button>
              </form>

              <p className="text-center text-purple-300/60 text-sm mt-6">
                <span className="text-purple-300/60">New to the cosmos? </span>
                <button onClick={() => window.location.reload()} className="font-medium hover:text-white transition-colors" style={{ color: "#f5c842" }}>
                  Join Us
                </button>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">✨</div>
                <h1 className="font-cinzel text-2xl font-bold text-white">Verify OTP</h1>
                <p className="text-purple-300/60 mt-2 text-sm">
                  We sent a 6-digit code to{" "}
                  <span className="text-purple-200 font-medium">+91 {phone}</span>
                </p>
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-xs mt-1 transition-colors"
                  style={{ color: "#f5c842" }}
                >
                  Change number
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP inputs */}
                <div className="flex justify-center gap-2.5">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="otp-input"
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
                  id="verify-otp-btn"
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
                >
                  {loading ? "Verifying…" : "Verify & Enter ✦"}
                </button>

                <div className="text-center text-sm text-purple-300/60">
                  {resendTimer > 0 ? (
                    <span>Resend OTP in <span className="text-white font-medium">{resendTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="font-medium hover:text-white transition-colors"
                      style={{ color: "#f5c842" }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>

              {/* Demo hint */}
              <div
                className="mt-6 px-4 py-3 rounded-xl text-center text-xs"
                style={{
                  background: "rgba(245,200,66,0.06)",
                  border: "1px solid rgba(245,200,66,0.15)",
                  color: "rgba(253,230,138,0.7)",
                }}
              >
                🧪 Demo mode: enter any 6-digit OTP (except 000000) to proceed
              </div>
            </>
          )}
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-8 text-purple-500/30 text-xs font-cinzel">
          ✦ Protected by CosmicChat Security ✦
        </div>
      </div>
    </div>
  );
}
