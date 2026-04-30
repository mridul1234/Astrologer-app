"use client";

import { useState, useEffect } from "react";

export default function AppDownloadBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't dismissed it before
    const dismissed = localStorage.getItem("apk-banner-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("apk-banner-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="sm:hidden w-full bg-gradient-to-r from-[#1a0a00] to-[#2d1200] border-b border-[#f5c842]/20 px-4 py-2.5 flex items-center justify-between gap-3 z-40">
      {/* Left: icon + text */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xl shrink-0">📱</span>
        <div className="min-w-0">
          <p className="text-white text-[12px] font-bold leading-tight truncate">
            Download the AstroWalla App
          </p>
          <p className="text-[#f5c842]/70 text-[10px] font-medium leading-tight">
            Faster · Better experience
          </p>
        </div>
      </div>

      {/* Right: download + close */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/astrowalla.apk"
          download="AstroWalla.apk"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f5c842] to-[#FF9933] text-[#1a0a00] text-[11px] font-extrabold uppercase tracking-wide shadow-md hover:shadow-[#f5c842]/40 hover:scale-105 transition-all active:scale-95"
        >
          ⬇ Download
        </a>
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors text-base leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
