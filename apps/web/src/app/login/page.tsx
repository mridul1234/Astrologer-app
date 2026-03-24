"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import VedicLoader from "../../components/VedicLoader";

type Step = "phone" | "otp" | "loading";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState("");
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

  async function sendOtp(phoneNumber: string): Promise<boolean> {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    const data = await res.json();

    if (!res.ok || !data.verificationId) {
      setError(data.error || "Failed to send OTP. Please try again.");
      return false;
    }

    setVerificationId(data.verificationId);
    return true;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);

    const ok = await sendOtp(phone);
    setLoading(false);

    if (ok) {
      setStep("otp");
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
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

    // Step 1: Validate OTP with Message Central
    const verifyRes = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, verificationId, otp: code }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      setError(verifyData.error || "Invalid OTP. Please try again.");
      setLoading(false);
      return;
    }

    // Step 2: OTP verified — sign in via NextAuth credentials
    setStep("loading");

    const result = await signIn("credentials", {
      phone,
      redirect: false,
    });

    if (result?.error) {
      setError("Sign-in failed. Please try again.");
      setStep("otp");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true);
    setOtp(["", "", "", "", "", ""]);
    setError("");

    const ok = await sendOtp(phone);
    setLoading(false);

    if (ok) {
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-center pt-10">
          <VedicLoader size="xl" text="Aligning the Stars…" />
          <p className="text-slate-500 font-medium text-sm mt-4">Preparing your cosmic dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#faf8f5]"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#FF9933]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#f5c842]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:scale-105 transition-transform">
            <span className="text-3xl animate-float inline-block drop-shadow-sm">✨</span>
            <span className="font-cinzel text-2xl font-bold tracking-wider" style={{ color: "#FF9933" }}>
              CosmicChat
            </span>
          </Link>
        </div>

        <div className="glass-card rounded-[2rem] px-8 py-10">
          {step === "phone" && (
            <>
              <div className="text-center mb-10">
                <div className="text-5xl mb-4 drop-shadow-sm">📱</div>
                <h1 className="font-cinzel text-3xl font-bold text-slate-800 tracking-wide">Welcome Back</h1>
                <p className="text-slate-500 font-medium mt-3 text-sm">
                  Enter your mobile number to receive a one-time passcode
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3 ml-1">
                    Mobile Number
                  </label>
                  <div className="flex gap-3">
                    <div
                      className="flex items-center px-4 rounded-2xl text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 shadow-inner"
                      style={{ minWidth: "70px", justifyContent: "center" }}
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
                      className="cosmic-input flex-1 px-5 py-4 rounded-2xl text-lg font-bold shadow-sm"
                      placeholder="98765 43210"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="text-sm font-semibold px-5 py-4 rounded-2xl shadow-sm"
                    style={{
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  id="send-otp-btn"
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="btn-gold w-full py-4 rounded-2xl text-lg font-extrabold uppercase tracking-wide shadow-lg mt-2"
                >
                  {loading ? "Sending OTP…" : "Send OTP ✦"}
                </button>
              </form>

              <p className="text-center text-slate-500 font-medium text-sm mt-8">
                <span className="text-slate-400">New to the cosmos? </span>
                <button onClick={() => window.location.reload()} className="font-bold hover:text-[#d97706] transition-colors" style={{ color: "#FF9933" }}>
                  Join Us
                </button>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-10">
                <div className="text-5xl mb-4 drop-shadow-sm">✨</div>
                <h1 className="font-cinzel text-3xl font-bold text-slate-800 tracking-wide">Verify OTP</h1>
                <p className="text-slate-500 font-medium mt-3 text-sm">
                  We sent a 6-digit code to{" "}
                  <span className="text-slate-800 font-bold">+91 {phone}</span>
                </p>
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); setVerificationId(""); }}
                  className="text-[11px] font-bold uppercase tracking-widest mt-2 hover:text-[#d97706] transition-colors"
                  style={{ color: "#FF9933" }}
                >
                  Change number
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                {/* OTP inputs */}
                <div className="flex justify-center gap-3">
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
                      className="otp-input shadow-sm"
                    />
                  ))}
                </div>

                {error && (
                  <div
                    className="text-sm font-semibold px-5 py-4 rounded-2xl shadow-sm text-center"
                    style={{
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="btn-gold w-full py-4 rounded-2xl text-lg font-extrabold uppercase tracking-wide shadow-lg"
                >
                  {loading ? "Verifying…" : "Verify & Enter ✦"}
                </button>

                <div className="text-center text-sm font-medium text-slate-500">
                  {resendTimer > 0 ? (
                    <span>Resend OTP in <span className="text-slate-800 font-bold">{resendTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="font-bold hover:text-[#d97706] transition-colors"
                      style={{ color: "#FF9933" }}
                    >
                      {loading ? "Resending…" : "Resend OTP"}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-10 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          ✦ Protected by CosmicChat Security ✦
        </div>
      </div>
    </div>
  );
}
