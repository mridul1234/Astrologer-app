"use client";
import { useState } from "react";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGN_HI = ["Mesh","Vrishabh","Mithun","Kark","Simha","Kanya","Tula","Vrischik","Dhanu","Makar","Kumbh","Meen"];
const SIGN_SYM = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const PLANET_NAMES = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu","Asc"];
const PLANET_ABBR = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke","As"];
const PLANET_COLORS = ["#f59e0b","#94a3b8","#ef4444","#22c55e","#f97316","#ec4899","#64748b","#8b5cf6","#ef4444","#d97706"];

// ─────────────────────────────────────────────
//  Astronomical Helpers
// ─────────────────────────────────────────────
function norm(d: number) { return ((d % 360) + 360) % 360; }

function getJD(yr: number, mo: number, dy: number, hr: number, mn: number, tz: number) {
  const ut = hr + mn / 60 - tz;
  let y = yr, m = mo, d = dy + ut / 24;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function ayanamsa(jd: number) { return 23.85 + 0.01396 * (jd - 2451545.0) / 365.25; }

function sunLon(jd: number) {
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = norm(357.52911 + 35999.05029 * T) * Math.PI / 180;
  return norm(L0 + (1.914602 - 0.004817 * T) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M));
}

function moonLon(jd: number) {
  const T = (jd - 2451545) / 36525;
  const L = 218.3165 + 481267.8813 * T;
  const M = norm(357.5291 + 35999.0503 * T) * Math.PI / 180;
  const Mp = norm(134.9629 + 477198.8676 * T) * Math.PI / 180;
  const D = norm(297.8502 + 445267.1115 * T) * Math.PI / 180;
  const F = norm(93.2721 + 483202.0175 * T) * Math.PI / 180;
  const dL = 6.2888 * Math.sin(Mp) + 1.2740 * Math.sin(2*D-Mp) + 0.6583 * Math.sin(2*D)
           + 0.2136 * Math.sin(2*Mp) - 0.1856 * Math.sin(M) - 0.1143 * Math.sin(2*F)
           + 0.0588 * Math.sin(2*D-2*Mp) + 0.0533 * Math.sin(2*D+Mp) + 0.0458 * Math.sin(2*D-M);
  return norm(L + dL);
}

function planetLon(jd: number, L0: number, L1: number, M0: number, M1: number, eoc: number) {
  const T = (jd - 2451545) / 36525;
  const L = L0 + L1 * T;
  const M = norm(M0 + M1 * T) * Math.PI / 180;
  return norm(L + eoc * Math.sin(M));
}

function rahuLon(jd: number) {
  const T = (jd - 2451545) / 36525;
  return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
}

function ascendant(jd: number, lat: number, lon: number) {
  const T = (jd - 2451545) / 36525;
  const GMST = norm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const LST = norm(GMST + lon);
  const eps = (23.439291 - 0.013004 * T) * Math.PI / 180;
  const RAMCrad = LST * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  let asc = Math.atan2(Math.cos(RAMCrad), -(Math.sin(RAMCrad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps)));
  asc = (asc * 180 / Math.PI + 360) % 360;
  return asc;
}

function calcAll(jd: number, lat: number, lon: number, tz: number) {
  const ay = ayanamsa(jd);
  const raw = [
    sunLon(jd),
    moonLon(jd),
    planetLon(jd, 355.433, 19140.2993, 19.373, 19140.2993, 10.691),    // Mars
    planetLon(jd, 252.251, 149472.6746, 174.791, 149472.6745, 23.440),  // Mercury
    planetLon(jd, 34.396, 3034.9957, 20.020, 3034.9957, 5.555),         // Jupiter
    planetLon(jd, 181.979, 58517.8157, 212.703, 58517.8157, 0.777),     // Venus
    planetLon(jd, 50.078, 1222.1138, 317.021, 1222.1137, 6.406),        // Saturn
    rahuLon(jd),
    norm(rahuLon(jd) + 180),
    ascendant(jd, lat, lon),
  ];
  return raw.map(r => norm(r - ay));
}

// ─────────────────────────────────────────────
//  North Indian Chart SVG
//  360×360 = 3×3 grid (120 each), corners split diagonally
// ─────────────────────────────────────────────
// House positions in 0-based sign numbers (lagna = house 1)
// layoutIndex → {type, polygon}
const HOUSE_POLYGONS = [
  "120,0 240,0 240,120 120,120",       // H1  top center rect
  "240,0 360,0 360,120",               // H2  NE outer triangle
  "240,0 240,120 360,120",             // H3  NE inner triangle
  "240,120 360,120 360,240 240,240",   // H4  right center rect
  "240,240 360,240 360,360",           // H5  SE outer triangle
  "240,240 360,360 240,360",           // H6  SE inner triangle
  "120,240 240,240 240,360 120,360",   // H7  bottom center rect
  "120,240 120,360 0,360",             // H8  SW inner triangle
  "0,240 120,240 0,360",               // H9  SW outer triangle
  "0,120 120,120 120,240 0,240",       // H10 left center rect
  "120,0 120,120 0,120",               // H11 NW inner triangle
  "0,0 120,0 0,120",                   // H12 NW outer triangle
];

// Label anchors for each house (cx, cy)
const HOUSE_LABELS: [number, number][] = [
  [180, 60],   // H1
  [320, 50],   // H2
  [290, 100],  // H3
  [300, 180],  // H4
  [310, 280],  // H5
  [270, 320],  // H6
  [180, 300],  // H7
  [70, 320],   // H8
  [50, 280],   // H9
  [60, 180],   // H10
  [70, 100],   // H11
  [40, 50],    // H12
];

function KundliChart({ lons }: { lons: number[] }) {
  const lagnaSign = Math.floor(lons[9] / 30); // 0-11

  // For each house (1-12), which sign occupies it?
  const houseSign = (h: number) => (lagnaSign + h - 1) % 12;

  // Which planet(s) are in each house?
  const planetsInHouse: Record<number, number[]> = {};
  for (let p = 0; p < 9; p++) {
    const sign = Math.floor(lons[p] / 30) % 12;
    const house = ((sign - lagnaSign + 12) % 12) + 1;
    if (!planetsInHouse[house]) planetsInHouse[house] = [];
    planetsInHouse[house].push(p);
  }

  return (
    <svg viewBox="0 0 360 360" className="w-full max-w-[360px] mx-auto" style={{border: "2px solid #f0c842", borderRadius: 8, background: "#fffdf8"}}>
      {/* draw each house polygon */}
      {HOUSE_POLYGONS.map((pts, i) => {
        const h = i + 1;
        const [cx, cy] = HOUSE_LABELS[i];
        const sign = houseSign(h);
        const planets = planetsInHouse[h] || [];
        return (
          <g key={h}>
            <polygon points={pts} fill={h === 1 ? "#fef9ec" : "#fffdf8"} stroke="#f0c842" strokeWidth="1.2"/>
            {/* Sign label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fill="#b45309" fontWeight="bold">{SIGN_SYM[sign]}</text>
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="#92400e">{SIGN_HI[sign]}</text>
            {/* Planet abbreviations */}
            {planets.map((p, pi) => (
              <text key={p} x={cx} y={cy + 16 + pi * 12} textAnchor="middle" fontSize="9" fill={PLANET_COLORS[p]} fontWeight="bold">
                {PLANET_ABBR[p]}
              </text>
            ))}
          </g>
        );
      })}
      {/* Center */}
      <rect x="120" y="120" width="120" height="120" fill="#fef3c7" stroke="#f0c842" strokeWidth="1.2"/>
      <text x="180" y="172" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">जन्म</text>
      <text x="180" y="186" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">कुंडली</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────
interface KundliResult {
  name: string;
  lons: number[];
  lagnaSign: number;
  moonSign: number;
  nakshatra: string;
  nakshatraPada: number;
}

export default function KundliPage() {
  const [form, setForm] = useState({ name: "", dob: "", tob: "12:00", city: "New Delhi" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<KundliResult | null>(null);

  async function generate() {
    if (!form.name || !form.dob || !form.city) { setError("Please fill all fields."); return; }
    setError(""); setLoading(true);
    try {
      // Geocode city
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.city)}&format=json&limit=1`, {
        headers: { "Accept-Language": "en" }
      }).then(r => r.json());
      
      let lat = 28.6139, lon = 77.2090, tz = 5.5; // Default: New Delhi
      if (geo?.[0]) {
        lat = parseFloat(geo[0].lat);
        lon = parseFloat(geo[0].lon);
        tz = Math.round(lon / 15 * 2) / 2; // nearest 0.5h
      }

      const [yr, mo, dy] = form.dob.split("-").map(Number);
      const [hr, mn] = form.tob.split(":").map(Number);
      const jd = getJD(yr, mo, dy, hr, mn, tz);
      const lons = calcAll(jd, lat, lon, tz);

      const moonLonSid = lons[1];
      const nakIdx = Math.floor(moonLonSid / (360 / 27));
      const nakPada = Math.floor((moonLonSid % (360 / 27)) / (360 / 108)) + 1;

      setResult({
        name: form.name,
        lons,
        lagnaSign: Math.floor(lons[9] / 30) % 12,
        moonSign: Math.floor(lons[1] / 30) % 12,
        nakshatra: NAKSHATRAS[nakIdx],
        nakshatraPada: nakPada,
      });
    } catch (e) {
      setError("Could not generate Kundli. Please try again.");
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans">
      <UserHeader />

      {/* ─── Hero ─── */}
      <div className="text-center py-12 px-4 bg-gradient-to-b from-[#fef9ec] to-[#fdfaf5] border-b border-[#f0e6c8]">
        <div className="text-4xl mb-3">🔮</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 mb-2">Free Kundli Generator</h1>
        <p className="text-stone-500 text-base font-medium max-w-md mx-auto">Enter your birth details to generate your personalized Vedic birth chart (Janam Kundli)</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ─── Form ─── */}
        {!result && (
          <div className="bg-white rounded-3xl border border-[#f0e6c8] shadow-sm p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-extrabold text-stone-900 mb-6 flex items-center gap-2">
              <span className="text-[#f5c842]">✦</span> Birth Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="e.g. Mridul Bansal"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date of Birth *</label>
                <input type="date" value={form.dob} onChange={e => setForm(f => ({...f, dob: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 text-sm font-medium text-stone-800 transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Time of Birth</label>
                <input type="time" value={form.tob} onChange={e => setForm(f => ({...f, tob: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 text-sm font-medium text-stone-800 transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">City of Birth *</label>
                <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  placeholder="e.g. New Delhi, Mumbai, Bangalore"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#fdfaf5] focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition-all"/>
              </div>
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              <button onClick={generate} disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-base hover:shadow-lg hover:shadow-amber-200/60 hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-60 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin"/>
                    Calculating your stars...
                  </span>
                ) : "🔮 Generate Free Kundli"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Result ─── */}
        {result && (
          <div className="space-y-8">
            {/* Header info */}
            <div className="bg-white rounded-3xl border border-[#f0e6c8] shadow-sm p-6 flex flex-wrap gap-6 items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">{result.name}</h2>
                <p className="text-stone-500 text-sm">Janam Kundli — Vedic Birth Chart</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Lagna", value: `${SIGN_SYM[result.lagnaSign]} ${SIGNS[result.lagnaSign]}` },
                  { label: "Rashi (Moon)", value: `${SIGN_SYM[result.moonSign]} ${SIGNS[result.moonSign]}` },
                  { label: "Nakshatra", value: `${result.nakshatra} (P${result.nakshatraPada})` },
                ].map(item => (
                  <div key={item.label} className="bg-[#fefaf0] border border-[#f0e6c8] rounded-2xl px-4 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">{item.label}</div>
                    <div className="text-sm font-extrabold text-stone-800 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setResult(null)}
                className="text-sm font-semibold text-[#d97706] hover:underline">
                ← Generate Another
              </button>
            </div>

            {/* Chart + Planet Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="bg-white rounded-3xl border border-[#f0e6c8] shadow-sm p-6">
                <h3 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                  <span className="text-[#f5c842]">✦</span> North Indian Chart
                </h3>
                <KundliChart lons={result.lons} />
                <p className="text-center text-[10px] text-stone-400 mt-3 font-medium">
                  Sidereal (Lahiri Ayanamsa) • Whole Sign Houses
                </p>
              </div>

              {/* Planet Table */}
              <div className="bg-white rounded-3xl border border-[#f0e6c8] shadow-sm p-6">
                <h3 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                  <span className="text-[#f5c842]">✦</span> Planet Positions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f0e6c8]">
                        <th className="text-left py-2 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">Planet</th>
                        <th className="text-left py-2 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">Sign</th>
                        <th className="text-left py-2 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">Degree</th>
                        <th className="text-left py-2 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">House</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.lons.map((lon, i) => {
                        const signIdx = Math.floor(lon / 30) % 12;
                        const deg = lon % 30;
                        const house = i === 9 ? 1 : ((signIdx - result.lagnaSign + 12) % 12) + 1;
                        return (
                          <tr key={i} className="border-b border-stone-50 hover:bg-[#fdfaf5] transition-colors">
                            <td className="py-2.5 pr-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background: PLANET_COLORS[i]}}>
                                  {PLANET_ABBR[i]}
                                </span>
                                <span className="font-semibold text-stone-800">{PLANET_NAMES[i]}</span>
                              </span>
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className="text-amber-700 font-semibold">{SIGN_SYM[signIdx]}</span>
                              <span className="text-stone-600 ml-1">{SIGNS[signIdx]}</span>
                            </td>
                            <td className="py-2.5 pr-3 text-stone-500 font-mono text-xs">
                              {Math.floor(deg)}° {Math.floor((deg % 1) * 60)}&apos;
                            </td>
                            <td className="py-2.5">
                              <span className="bg-amber-50 text-amber-700 font-bold text-xs px-2 py-0.5 rounded-full border border-amber-200">
                                H{house}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#fef9ec] to-[#fef3c7] rounded-3xl border border-[#f0e6c8] p-8 text-center">
              <div className="text-3xl mb-3">🌟</div>
              <h3 className="text-xl font-extrabold text-stone-900 mb-2">Want a deeper reading?</h3>
              <p className="text-stone-500 text-sm mb-5">Chat live with a verified Vedic astrologer for personalized insights on your Kundli</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold text-sm hover:shadow-lg hover:shadow-amber-200/60 hover:scale-105 transition-all duration-200">
                💬 Chat with Astrologer
              </Link>
            </div>
          </div>
        )}
      </div>
      <MobileBottomNav />
      <UserFooter />
    </div>
  );
}
