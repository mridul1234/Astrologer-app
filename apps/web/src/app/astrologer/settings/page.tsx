"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── No dummy data — will be populated from API ───────────────────────────────
const EMPTY_ASTROLOGER = {
  name: "",
  phone: "—",
  bio: "",
  speciality: "",
  ratePerMin: 20,
  languages: [] as string[],
  memberSince: "—",
  totalSessions: 0,
  totalEarnings: 0,
  walletEarnings: 0,
  rating: 0,
  totalReviews: 0,
};

const EMPTY_REVIEWS: { id: string; name: string; sign: string; rating: number; text: string; date: string }[] = [];
const EMPTY_SESSIONS: { id: string; user: string; date: string; duration: string; cost: number; status: string }[] = [];

const ZODIAC_AVATARS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const ZODIAC_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const ALL_SPECIALITIES = [
  "Vedic Astrology", "KP Astrology", "Numerology", "Tarot", "Palmistry",
  "Western Astrology", "Vastu Shastra", "Nadi Astrology", "Angel Cards", "Crystal Healing",
];

const ALL_LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi", "Gujarati", "Malayalam", "Punjabi"];

type Tab = "overview" | "profile" | "earnings" | "reviews";

export default function AstrologerSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Profile edit state
  const [profile, setProfile] = useState({
    name: EMPTY_ASTROLOGER.name,
    bio: EMPTY_ASTROLOGER.bio,
    ratePerMin: EMPTY_ASTROLOGER.ratePerMin,
    languages: EMPTY_ASTROLOGER.languages,
    selectedSpecialities: [] as string[],
    whatsappNumber: "",
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [selectedZodiac, setSelectedZodiac] = useState(0); // Aries
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showZodiacPicker, setShowZodiacPicker] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Load astrologer profile from API
  useEffect(() => {
    fetch("/api/astrologer/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setProfile((p) => ({
            ...p,
            name: data.user?.name ?? "",
            bio: data.bio ?? "",
            ratePerMin: data.ratePerMin ?? 20,
            languages: data.languages ? data.languages.split(", ") : [],
            selectedSpecialities: data.speciality ? data.speciality.split(", ") : [],
            whatsappNumber: data.whatsappNumber ?? "",
          }));
        }
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/astrologer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          ratePerMin: profile.ratePerMin,
          languages: profile.languages.join(", "),
          speciality: profile.selectedSpecialities.join(", "),
          whatsappNumber: profile.whatsappNumber,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d?.error ?? "Failed to save. Please try again.");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleSpeciality(s: string) {
    setProfile((p) => ({
      ...p,
      selectedSpecialities: p.selectedSpecialities.includes(s)
        ? p.selectedSpecialities.filter((x) => x !== s)
        : [...p.selectedSpecialities, s],
    }));
  }

  function toggleLanguage(lang: string) {
    setProfile((p) => ({
      ...p,
      languages: p.languages.includes(lang)
        ? p.languages.filter((x) => x !== lang)
        : [...p.languages, lang],
    }));
  }

  const tabStyle = (t: Tab) =>
    activeTab === t
      ? {
          background: "linear-gradient(135deg, rgba(245,200,66,0.12), rgba(124,58,237,0.12))",
          border: "1px solid rgba(245,200,66,0.25)",
          color: "#f5c842",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(196,181,253,0.6)",
        };

  return (
    <div className="min-h-screen" style={{ position: "relative", zIndex: 1 }}>
      {/* ─── NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(5,3,17,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/astrologer")} className="text-purple-400/60 hover:text-white transition-colors mr-1">←</button>
          <span className="text-xl">🔮</span>
          <span className="font-cinzel text-lg font-bold" style={{ color: "#f5c842" }}>AstroWalla</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.2)", color: "#f5c842" }}>Astrologer</span>
        </div>
        <Link href="/astrologer" className="text-sm text-purple-300/60 hover:text-white transition-colors">← Dashboard</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* ─── PROFILE HERO ─── */}
        <div
          className="rounded-3xl p-8 mb-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(217,119,6,0.1), rgba(124,58,237,0.08))",
            border: "1px solid rgba(245,200,66,0.12)",
          }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ border: "1px solid #f5c842" }} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar with zodiac picker */}
            <div className="relative">
              <button
                id="astro-zodiac-btn"
                onClick={() => setShowZodiacPicker(!showZodiacPicker)}
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl group relative transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, rgba(217,119,6,0.3), rgba(124,58,237,0.25))",
                  border: "2px solid rgba(245,200,66,0.3)",
                }}
              >
                {ZODIAC_AVATARS[selectedZodiac]}
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white" style={{ background: "rgba(0,0,0,0.5)" }}>Edit</div>
              </button>
              {showZodiacPicker && (
                <div className="absolute top-24 left-0 z-20 p-4 rounded-2xl grid grid-cols-6 gap-2 w-64" style={{ background: "rgba(10,6,30,0.98)", border: "1px solid rgba(245,200,66,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
                  <div className="col-span-6 text-xs text-purple-400/60 mb-1 font-medium">Choose your sign</div>
                  {ZODIAC_AVATARS.map((z, i) => (
                    <button key={i} title={ZODIAC_NAMES[i]} id={`astro-zodiac-${ZODIAC_NAMES[i].toLowerCase()}`} onClick={() => { setSelectedZodiac(i); setShowZodiacPicker(false); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:scale-110 transition-all"
                      style={selectedZodiac === i ? { background: "rgba(245,200,66,0.2)", border: "1px solid rgba(245,200,66,0.4)" } : { background: "rgba(255,255,255,0.05)" }}>
                      {z}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-cinzel text-2xl font-bold text-white">{profile.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(245,200,66,0.12)", border: "1px solid rgba(245,200,66,0.25)", color: "#f5c842" }}>
                  {ZODIAC_NAMES[selectedZodiac]} ✦ Astrologer
                </span>
              </div>
              <p className="text-purple-300/50 text-sm mb-4">{EMPTY_ASTROLOGER.phone} · Since {EMPTY_ASTROLOGER.memberSince}</p>
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: "⭐", label: "Rating", value: EMPTY_ASTROLOGER.rating === 0 ? "—" : `${EMPTY_ASTROLOGER.rating} (${EMPTY_ASTROLOGER.totalReviews})` },
                  { icon: "💬", label: "Sessions", value: EMPTY_ASTROLOGER.totalSessions.toLocaleString() },
                  { icon: "💰", label: "Earned", value: `₹${EMPTY_ASTROLOGER.totalEarnings.toLocaleString()}` },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg">{s.icon}</div>
                    <div className="font-cinzel font-bold text-white text-sm">{s.value}</div>
                    <div className="text-purple-400/50 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: "overview", label: "🏠 Overview" },
            { key: "profile", label: "✏️ Edit Profile" },
            { key: "earnings", label: "💰 Earnings" },
            { key: "reviews", label: "⭐ Reviews" },
          ] as const).map((tab) => (
            <button key={tab.key} id={`astro-tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={tabStyle(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-slide-up">
            <ASection title="Recent Sessions" icon="💬">
              <div className="space-y-3">
                {EMPTY_SESSIONS.length === 0 ? (
                  <div className="py-8 text-center text-purple-400/40 text-sm">🌙 No sessions yet</div>
                ) : EMPTY_SESSIONS.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/5 transition-all" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(124,58,237,0.2))", color: "#6ee7b7" }}>{s.user[0]}</div>
                      <div>
                        <div className="text-white font-medium text-sm">{s.user}</div>
                        <div className="text-purple-400/60 text-xs">{s.date} · {s.duration}</div>
                      </div>
                    </div>
                    <div className="font-cinzel font-bold text-sm" style={{ color: "#f5c842" }}>+₹{s.cost}</div>
                  </div>
                ))}
              </div>
            </ASection>

            <ASection title="Recent Reviews" icon="⭐">
              <div className="space-y-3">
                {EMPTY_REVIEWS.length === 0 ? (
                  <div className="py-8 text-center text-purple-400/40 text-sm">⭐ No reviews yet</div>
                ) : EMPTY_REVIEWS.slice(0, 2).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                <button onClick={() => setActiveTab("reviews")} className="text-sm font-medium hover:text-white transition-colors" style={{ color: "#f5c842" }}>View all reviews →</button>
              </div>
            </ASection>
          </div>
        )}

        {/* ─── EDIT PROFILE TAB ─── */}
        {activeTab === "profile" && (
          <div className="animate-slide-up">
            <ASection title="Edit Your Profile" icon="✏️">
              <div className="space-y-6 max-w-xl">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">Display Name</label>
                  <input id="astro-name-input" type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="astrowalla-input w-full px-4 py-3.5 rounded-xl text-base" placeholder="Your name" />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">Bio / About You</label>
                  <textarea id="astro-bio-input" rows={4} value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    className="astrowalla-input w-full px-4 py-3.5 rounded-xl text-sm resize-none leading-relaxed"
                    placeholder="Tell seekers about your experience, approach, and specialties…" />
                  <p className="text-purple-400/40 text-xs mt-1">{profile.bio.length}/300 characters</p>
                </div>

                {/* Specialities multi-select */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-3">Specialities <span className="text-purple-400/40">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SPECIALITIES.map((s) => (
                      <button key={s} id={`spec-${s.replace(/\s/g, "-").toLowerCase()}`}
                        onClick={() => toggleSpeciality(s)}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={
                          profile.selectedSpecialities.includes(s)
                            ? { background: "linear-gradient(135deg, rgba(245,200,66,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(245,200,66,0.35)", color: "#f5c842" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(196,181,253,0.5)" }
                        }>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-3">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_LANGUAGES.map((lang) => (
                      <button key={lang} id={`lang-${lang.toLowerCase()}`} onClick={() => toggleLanguage(lang)}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={
                          profile.languages.includes(lang)
                            ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(196,181,253,0.5)" }
                        }>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rate per minute */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">
                    Rate per Minute (₹) <span className="text-purple-400/40">· min ₹5, max ₹500</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "#f5c842" }}>₹</span>
                      <input id="rate-input" type="number" min={5} max={500}
                        value={profile.ratePerMin}
                        onChange={(e) => setProfile((p) => ({ ...p, ratePerMin: Number(e.target.value) }))}
                        className="astrowalla-input w-full pl-8 pr-4 py-3.5 rounded-xl text-base font-cinzel font-bold" />
                    </div>
                    <div className="text-purple-300/50 text-sm">per minute</div>
                  </div>
                  {/* Rate presets */}
                  <div className="flex gap-2 mt-3">
                    {[10, 20, 30, 50, 100].map((r) => (
                      <button key={r} onClick={() => setProfile((p) => ({ ...p, ratePerMin: r }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={
                          profile.ratePerMin === r
                            ? { background: "rgba(245,200,66,0.15)", border: "1px solid rgba(245,200,66,0.3)", color: "#f5c842" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(196,181,253,0.5)" }
                        }>
                        ₹{r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-medium text-purple-200/70 mb-2">
                    WhatsApp Number
                    <span className="ml-2 text-purple-400/40">(for chat request alerts)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg select-none">📱</span>
                    <input
                      id="astro-whatsapp-input"
                      type="tel"
                      value={profile.whatsappNumber}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, whatsappNumber: e.target.value }))
                      }
                      className="astrowalla-input w-full pl-10 pr-4 py-3.5 rounded-xl text-base"
                      placeholder="e.g. 9876543210"
                      maxLength={15}
                    />
                  </div>
                  <p className="text-purple-400/40 text-xs mt-1.5">
                    🔒 Only used to notify you of new chat requests via WhatsApp. Never shared publicly.
                  </p>
                </div>

                {saveError && (
                  <div className="px-4 py-3 rounded-xl text-sm text-center"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    ⚠️ {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="px-4 py-3 rounded-xl text-sm text-center"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#6ee7b7" }}>
                    ✅ Profile updated successfully!
                  </div>
                )}

                <button id="save-astro-profile-btn" onClick={handleSave} disabled={saving}
                  className="btn-gold px-8 py-3.5 rounded-2xl font-bold text-base">
                  {saving ? "Saving…" : "Save Profile ✦"}
                </button>
              </div>
            </ASection>

            {/* Account section */}
            <ASection title="Account" icon="🛡️">
              <div className="max-w-md space-y-3">
                <div className="px-5 py-4 rounded-2xl flex items-center justify-between"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <div>
                    <div className="text-red-300 font-medium text-sm">Sign Out</div>
                    <div className="text-red-400/50 text-xs mt-0.5">Sign out of all devices</div>
                  </div>
                  <button id="astro-signout-btn" onClick={() => router.push("/login")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                    Sign Out
                  </button>
                </div>
              </div>
            </ASection>
          </div>
        )}

        {/* ─── EARNINGS TAB ─── */}
        {activeTab === "earnings" && (
          <div className="space-y-6 animate-slide-up">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Earned", value: `₹${EMPTY_ASTROLOGER.totalEarnings.toLocaleString()}`, icon: "💰", color: "#f5c842", bg: "rgba(245,200,66,0.06)", border: "rgba(245,200,66,0.12)" },
                { label: "Pending Payout", value: `₹${EMPTY_ASTROLOGER.walletEarnings.toLocaleString()}`, icon: "⏳", color: "#c4b5fd", bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.12)" },
                { label: "Total Sessions", value: EMPTY_ASTROLOGER.totalSessions.toLocaleString(), icon: "💬", color: "#6ee7b7", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.12)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-6 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-cinzel text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-purple-400/60 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Payout request */}
            <ASection title="Request Payout" icon="🏦">
              <div className="max-w-md">
                <p className="text-purple-300/60 text-sm mb-5 leading-relaxed">
                  You have <span className="font-bold" style={{ color: "#f5c842" }}>₹{EMPTY_ASTROLOGER.walletEarnings.toLocaleString()}</span> pending. Request a payout to your registered bank account.
                </p>
                <button id="request-payout-btn" onClick={() => setShowPayoutModal(true)}
                  className="btn-gold px-8 py-3.5 rounded-2xl font-bold">
                  Request Payout ₹{EMPTY_ASTROLOGER.walletEarnings.toLocaleString()} →
                </button>
              </div>
            </ASection>

            {/* Session earnings list */}
            <ASection title="Session Earnings" icon="📋">
              <div className="space-y-3">
                {EMPTY_SESSIONS.length === 0 ? (
                  <div className="py-8 text-center text-purple-400/40 text-sm">🌙 No session earnings yet</div>
                ) : EMPTY_SESSIONS.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div className="text-white text-sm font-medium">{s.user}</div>
                      <div className="text-purple-400/50 text-xs">{s.date} · {s.duration}</div>
                    </div>
                    <div className="font-cinzel font-bold text-sm" style={{ color: "#34d399" }}>+₹{s.cost}</div>
                  </div>
                ))}
              </div>
            </ASection>
          </div>
        )}

        {/* ─── REVIEWS TAB ─── */}
        {activeTab === "reviews" && (
          <div className="animate-slide-up">
            <ASection title={`Reviews (${EMPTY_ASTROLOGER.totalReviews})`} icon="⭐">
              {/* Average rating card */}
              <div className="flex items-center gap-6 mb-6 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.12)" }}>
                <div className="text-center">
                  <div className="font-cinzel text-5xl font-black" style={{ color: "#f5c842" }}>{EMPTY_ASTROLOGER.rating || "—"}</div>
                  <div className="text-yellow-400 text-xl mt-1">★★★★★</div>
                  <div className="text-purple-400/50 text-xs mt-1">{EMPTY_ASTROLOGER.totalReviews} reviews</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-purple-400/50 w-4">{star}★</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #d97706, #f5c842)" }} />
                        </div>
                        <span className="text-xs text-purple-400/40 w-6">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {EMPTY_REVIEWS.length === 0 ? (
                  <div className="py-8 text-center text-purple-400/40 text-sm">⭐ No reviews yet</div>
                ) : EMPTY_REVIEWS.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </ASection>
          </div>
        )}
      </main>

      {/* ─── PAYOUT MODAL ─── */}
      {showPayoutModal && (
        <PayoutModal amount={EMPTY_ASTROLOGER.walletEarnings} onClose={() => setShowPayoutModal(false)} />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ASection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h2 className="font-cinzel font-bold text-white text-lg mb-5 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function ReviewCard({ review }: { review: { name: string; sign: string; rating: number; text: string; date: string } }) {
  return (
    <div className="px-5 py-4 rounded-2xl glass-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.2))", color: "#c4b5fd" }}>
            {review.name[0]}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{review.name}</div>
            <div className="text-purple-400/50 text-xs">{review.sign} · {review.date}</div>
          </div>
        </div>
        <div className="text-yellow-400 text-sm">{"★".repeat(review.rating)}</div>
      </div>
      <p className="text-purple-200/60 text-sm leading-relaxed italic">"{review.text}"</p>
    </div>
  );
}

function PayoutModal({ amount, onClose }: { amount: number; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");

  async function handleRequest() {
    if (!bankAccount || !ifsc) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("success");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(5,3,17,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl px-8 py-10 animate-slide-up"
        style={{ background: "rgba(15,10,35,0.95)", border: "1px solid rgba(245,200,66,0.15)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        {step === "success" ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-cinzel text-xl font-bold text-white mb-2">Payout Requested!</h2>
            <p className="text-purple-300/60 text-sm mb-6">Your payout of ₹{amount.toLocaleString()} will be processed within 2–3 business days.</p>
            <button onClick={onClose} className="btn-gold px-8 py-3 rounded-2xl font-bold">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-xl font-bold text-white">Request Payout</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition">✕</button>
            </div>
            <div className="px-5 py-3 rounded-2xl mb-5 text-center" style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.12)" }}>
              <div className="text-purple-300/50 text-xs mb-1">Amount to withdraw</div>
              <div className="font-cinzel text-3xl font-bold" style={{ color: "#f5c842" }}>₹{amount.toLocaleString()}</div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-purple-200/70 mb-2">Bank Account Number</label>
                <input id="bank-account-input" type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                  className="astrowalla-input w-full px-4 py-3.5 rounded-xl text-base" placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200/70 mb-2">IFSC Code</label>
                <input id="ifsc-input" type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="astrowalla-input w-full px-4 py-3.5 rounded-xl text-base uppercase" placeholder="SBIN0001234" />
              </div>
            </div>
            <button id="submit-payout-btn" onClick={handleRequest} disabled={loading || !bankAccount || !ifsc}
              className="btn-gold w-full py-4 rounded-2xl font-bold">
              {loading ? "Submitting…" : "Submit Payout Request ✦"}
            </button>
            <p className="text-center text-purple-500/30 text-xs mt-4">🔒 Demo mode — no actual transfer will occur</p>
          </>
        )}
      </div>
    </div>
  );
}
