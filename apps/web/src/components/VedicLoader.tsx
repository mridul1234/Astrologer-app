"use client";

import React from "react";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
}

export default function VedicLoader({ size = "md", text }: Props) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeMap[size]} bg-gradient-to-br from-[#ffce4b] to-[#d97706] rounded-full flex items-center justify-center border-2 border-[#f0c842]/60 shadow-[0_0_20px_rgba(245,200,66,0.3)] p-1 overflow-hidden relative`}
      >
        {/* Outer Rotating Ring with Vedic/Astrology elements */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-amber-900 opacity-90 animate-[spin_10s_linear_infinite]"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
          
          {/* Inner geometry */}
          <path d="M50 12 L50 88 M12 50 L88 50 M23 23 L77 77 M23 77 L77 23" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
          
          {/* Small celestial bodies / points */}
          <circle cx="50" cy="8" r="2" fill="currentColor" />
          <circle cx="50" cy="92" r="2" fill="currentColor" />
          <circle cx="8" cy="50" r="2" fill="currentColor" />
          <circle cx="92" cy="50" r="2" fill="currentColor" />
          
          {/* Constellation dots */}
          <text x="50" y="24" fontSize="10" textAnchor="middle" fill="currentColor">☀️</text>
          <text x="78" y="54" fontSize="10" textAnchor="middle" fill="currentColor">🌙</text>
          <text x="50" y="82" fontSize="10" textAnchor="middle" fill="currentColor">✨</text>
          <text x="22" y="54" fontSize="10" textAnchor="middle" fill="currentColor">⭐</text>
        </svg>

        {/* Center Static Element - Om */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-amber-900 drop-shadow-sm font-bold truncate" style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '24px' : size === 'lg' ? '40px' : '56px' }}>
            ॐ
          </span>
        </div>
      </div>

      {text && (
        <div className="text-stone-500 font-cinzel font-bold text-sm uppercase tracking-widest drop-shadow-sm">
          {text}
        </div>
      )}
    </div>
  );
}
