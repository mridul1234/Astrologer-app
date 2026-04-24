"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const STEPS = ["Personal", "Birth Date", "Birth Place"];

const ZODIAC_SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true); // checking existing profile
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("12:00");
  const [placeOfBirth, setPlaceOfBirth] = useState("");

  // Check if kundli already exists → skip onboarding
  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }

    fetch("/api/user/kundli")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.fullName) {
          // Already onboarded — go home
          router.replace("/home");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [session, status, router]);

  async function handleSubmit() {
    setError("");
    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!dateOfBirth) { setError("Please select your date of birth."); return; }
    if (!placeOfBirth.trim()) { setError("Please enter your place of birth."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/user/kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, dateOfBirth, timeOfBirth, placeOfBirth }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save. Please try again.");
        setSaving(false);
        return;
      }
      router.replace("/home");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  function canProceed() {
    if (step === 0) return fullName.trim().length >= 2;
    if (step === 1) return !!dateOfBirth;
    return placeOfBirth.trim().length >= 2;
  }

  function next() {
    if (step < 2) setStep((s) => s + 1);
    else handleSubmit();
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1040,#2d1b69)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto shadow-lg border-2 border-white/20">
            <img src="/logo.jpeg" alt="AstroWalla Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-white/60 text-sm font-medium animate-pulse">Aligning the stars…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#1a1040 0%,#2d1b69 50%,#160d35 100%)" }}>

      {/* Floating zodiac decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {ZODIAC_SIGNS.map((z, i) => (
          <span key={i} className="absolute font-bold text-[#f5c842] select-none"
            style={{
              fontSize: `${14 + (i % 3) * 6}px`,
              top: `${5 + (i * 8)}%`,
              left: `${3 + (i * 8.5)}%`,
              opacity: 0.08 + (i % 3) * 0.04,
              animation: `float ${4 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            }}>
            {z}
          </span>
        ))}
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,153,51,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-center pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border-2 border-white/20 shrink-0">
              <img src="/logo.jpeg" alt="AstroWalla Logo" className="w-full h-full object-contain" />
            </div>
          <span className="font-cinzel font-black text-white text-xl tracking-wide">AstroWalla</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300"
                      style={{
                        background: i <= step ? "linear-gradient(135deg,#FF9933,#f5c842)" : "rgba(255,255,255,0.1)",
                        color: i <= step ? "#1a1040" : "rgba(255,255,255,0.4)",
                        boxShadow: i === step ? "0 0 16px rgba(245,200,66,0.5)" : "none",
                      }}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest mt-1"
                      style={{ color: i <= step ? "#f5c842" : "rgba(255,255,255,0.3)" }}>
                      {s}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="w-16 sm:w-24 h-[2px] mb-4 rounded-full transition-all duration-500"
                      style={{ background: i < step ? "linear-gradient(90deg,#FF9933,#f5c842)" : "rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(245,200,66,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}>

            {/* Step 0: Name */}
            {step === 0 && (
              <div className="animate-slide-up">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">👤</div>
                  <h1 className="font-cinzel font-black text-white text-2xl mb-1">Welcome, Seeker!</h1>
                  <p className="text-white/50 text-sm">Let&apos;s start with your name so astrologers can address you.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#f5c842] mb-2">
                    Your Full Name
                  </label>
                  <input
                    id="onboarding-name"
                    type="text"
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canProceed() && next()}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-5 py-4 rounded-2xl text-base font-medium text-white placeholder:text-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(245,200,66,0.3)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(245,200,66,0.7)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(245,200,66,0.3)")}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Birth Date & Time */}
            {step === 1 && (
              <div className="animate-slide-up">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🌙</div>
                  <h1 className="font-cinzel font-black text-white text-2xl mb-1">Your Birth Details</h1>
                  <p className="text-white/50 text-sm">The exact moment you were born shapes your entire cosmic map.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#f5c842] mb-2">
                      Date of Birth *
                    </label>
                    <input
                      id="onboarding-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-5 py-4 rounded-2xl text-base font-medium text-white outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(245,200,66,0.3)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#f5c842] mb-2">
                      Time of Birth <span className="normal-case text-white/30 text-[10px]">(if known)</span>
                    </label>
                    <input
                      id="onboarding-tob"
                      type="time"
                      value={timeOfBirth}
                      onChange={(e) => setTimeOfBirth(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl text-base font-medium text-white outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(245,200,66,0.3)",
                        colorScheme: "dark",
                      }}
                    />
                    <p className="text-white/30 text-[10px] mt-1.5 ml-1">
                      Default is noon if you don&apos;t know your exact time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Birth Place */}
            {step === 2 && (
              <div className="animate-slide-up">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🌍</div>
                  <h1 className="font-cinzel font-black text-white text-2xl mb-1">Place of Birth</h1>
                  <p className="text-white/50 text-sm">Your birthplace determines your Ascendant (Lagna) and house positions.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#f5c842] mb-2">
                    City / Town *
                  </label>
                  <input
                    id="onboarding-place"
                    type="text"
                    autoFocus
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canProceed() && next()}
                    placeholder="e.g. New Delhi, Mumbai, Bangalore"
                    className="w-full px-5 py-4 rounded-2xl text-base font-medium text-white placeholder:text-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(245,200,66,0.3)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(245,200,66,0.7)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(245,200,66,0.3)")}
                  />
                </div>

                {/* Summary preview */}
                {fullName && dateOfBirth && (
                  <div className="mt-5 p-4 rounded-2xl" style={{ background: "rgba(245,200,66,0.08)", border: "1px solid rgba(245,200,66,0.2)" }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#f5c842] mb-2">Your Kundli Details</p>
                    <div className="space-y-1 text-sm font-medium text-white/70">
                      <p>👤 {fullName}</p>
                      <p>📅 {new Date(dateOfBirth + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p>🕐 {timeOfBirth}</p>
                      {placeOfBirth && <p>📍 {placeOfBirth}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  ← Back
                </button>
              )}
              <button
                id="onboarding-next-btn"
                onClick={next}
                disabled={!canProceed() || saving}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-base transition-all disabled:opacity-40"
                style={{
                  background: canProceed() && !saving ? "linear-gradient(135deg,#FF9933,#f5c842)" : "rgba(255,255,255,0.08)",
                  color: canProceed() && !saving ? "#1a1040" : "rgba(255,255,255,0.3)",
                  boxShadow: canProceed() && !saving ? "0 4px 20px rgba(245,200,66,0.35)" : "none",
                }}>
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving your stars…
                  </span>
                ) : step === 2 ? "✦ Generate My Kundli" : "Continue →"}
              </button>
            </div>

            {/* Skip option */}
            <div className="text-center mt-4">
              <button
                onClick={() => router.replace("/home")}
                className="text-white/30 text-xs font-medium hover:text-white/50 transition-colors">
                Skip for now
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest font-bold mt-5">
            ✦ Your data is private & secure ✦
          </p>
        </div>
      </div>
    </div>
  );
}
