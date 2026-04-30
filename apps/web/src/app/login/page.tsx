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
  const [otp, setOtp] = useState(["", "", "", ""]);
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
      
      // Eagerly prefetch dashboard data to warm up Vercel Edge cache
      fetch("/api/astrologers").catch(() => {});
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 3)]?.focus();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 4) {
      setError("Please enter the full 4-digit OTP.");
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

    router.push("/onboarding");
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true);
    setOtp(["", "", "", ""]);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf8f5" }}>
        <div className="text-center pt-10">
          <VedicLoader size="xl" text="Aligning the Stars…" />
          <p className="text-slate-500 font-medium text-sm mt-4">Preparing your AstroWalla dashboard</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#faf8f5" }}>

      {/* ── Navy Header Band ── */}
      <div style={{ background: "linear-gradient(160deg, #1a1040 0%, #2d1b69 50%, #160d35 100%)", position: "relative", overflow: "hidden" }}>
        {/* Subtle star dots */}
        {[[8,20],[18,75],[28,45],[38,88],[52,12],[62,60],[72,33]].map(([t,l],i)=>(
          <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{ top:`${t}%`,left:`${l}%`,width:i%2===0?2:1.5,height:i%2===0?2:1.5,opacity:0.15+i*0.03 }}/>
        ))}
        <div className="relative max-w-md mx-auto px-4 py-8 sm:py-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
            <img src="/logo.jpeg" alt="AstroWalla Logo" className="h-9 w-9 object-contain" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-cinzel font-black text-white text-lg tracking-wide leading-none">AstroWalla</span>
              <span className="text-[8px] uppercase tracking-[0.16em] font-bold mt-[3px]" style={{ color: "rgba(245,200,66,0.8)" }}>Your Celestial Guide</span>
            </div>
          </Link>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Your AstroWalla journey starts here</p>
        </div>
        {/* Wave divider */}
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width:"100%", height:"40px", display:"block", marginTop:"-1px" }}>
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#faf8f5"/>
        </svg>
      </div>

      {/* ── Form Area ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 sm:px-4 sm:py-10">
        <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl sm:rounded-[2rem] px-5 py-8 sm:px-8 sm:py-10 mx-auto">
          {step === "phone" && (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <img src="/logo.jpeg" alt="AstroWalla Logo" className="h-14 w-14 object-contain mx-auto mb-4" />
                <h1 className="font-cinzel text-xl sm:text-3xl font-bold text-slate-800 tracking-wide">Welcome Back</h1>
                <p className="text-slate-500 font-medium mt-2 text-xs sm:text-sm">
                  Enter your mobile number to receive a one-time passcode
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-600 mb-2 sm:mb-3 ml-1">
                    Mobile Number
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <div
                      className="flex items-center px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 shadow-inner shrink-0"
                      style={{ minWidth: "60px", justifyContent: "center" }}
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
                      className="astrowalla-input flex-1 w-0 min-w-0 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-sm"
                      placeholder="98765 43210"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm"
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
                  className="btn-gold w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-extrabold uppercase tracking-wide shadow-lg mt-2"
                >
                  {loading ? "Sending OTP…" : "Send OTP ✦"}
                </button>
              </form>

            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-white text-2xl" style={{ background: "linear-gradient(135deg,#FF9933,#f5c842)" }}>✦</div>
                <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-800 tracking-wide">Verify OTP</h1>
                <p className="text-slate-500 font-medium mt-2 text-sm">
                  We sent a 4-digit code to{" "}
                  <span className="text-slate-800 font-bold">+91 {phone}</span>
                </p>
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","",""]); setError(""); setVerificationId(""); }}
                  className="text-[11px] font-bold uppercase tracking-widest mt-2 hover:text-[#d97706] transition-colors"
                  style={{ color: "#FF9933" }}
                >
                  Change number
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                {/* OTP inputs */}
                <div className="flex justify-center gap-2 sm:gap-3">
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
                      style={{ width: "clamp(48px, 18vw, 56px)", height: "clamp(52px, 16vw, 64px)", fontSize: "clamp(1.2rem, 5vw, 1.6rem)" }}
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
                  disabled={loading || otp.join("").length < 4}
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
        <div className="text-center mt-8 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          ✦ Protected by AstroWalla Security ✦
        </div>
        </div>
      </div>
    </div>
  );
}
