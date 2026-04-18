"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

interface AstrologerProfile {
  id: string;
  name: string;
  bio: string | null;
  speciality: string | null;
  categories: string[];
  experienceYears: number;
  languages: string;
  ratePerMin: number;
  isOnline: boolean;
  orderCount: number;
  avgRating: number;
  reviews: Review[];
  profileImage: string | null;
}

export default function PublicAstrologerProfile() {
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/public/astrologer/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  const getStars = (avg: number) => {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
  };

  const getWaitMins = () => {
    // Mock estimate wait time
    return 5;
  };

  async function startChat() {
    if (!profile) return;
    setStarting(true);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ astrologerId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) router.push("/wallet"); 
        setStarting(false);
        return;
      }
      router.push(`/dashboard/chat/${data.sessionId}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-500 font-bold">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-extrabold text-stone-800">Astrologer Not Found</h1>
        <button onClick={() => router.push("/dashboard")} className="mt-4 px-6 py-2 bg-[#f5c842] text-stone-900 rounded-xl font-bold">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-slate-800 font-sans flex flex-col pb-24 sm:pb-0">
      <UserHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Back Button */}
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 font-bold text-sm mb-6 transition-colors">
          <span>←</span> Back to Astrologers
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-[#f0e6c8] shadow-sm flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fef3c7] to-transparent pointer-events-none rounded-bl-full opacity-50" />
          
          <div className="shrink-0 relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[4px] border-[#f5c842] p-1 shadow-lg shadow-amber-200/50 relative z-10">
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-6xl sm:text-7xl overflow-hidden">
                {profile.profileImage
                  ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                  : <span>👨🏽‍🦱</span>
                }
              </div>
            </div>
            {profile.isOnline && (
              <div className="absolute bottom-2 right-4 sm:right-6 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full z-20"></div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left relative z-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 uppercase tracking-tight">{profile.name}</h1>
              <div className="inline-flex items-center justify-center px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="font-extrabold text-xl text-stone-900">₹{profile.ratePerMin}</span>
                <span className="text-xs text-stone-500 font-bold ml-1 uppercase tracking-widest mt-1">/Min</span>
              </div>
            </div>
            
            <p className="text-stone-500 font-medium text-lg italic mb-4">{profile.speciality || "Vedic Astrology Expert"}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[#16a34a] text-lg font-bold leading-none">
                  {profile.avgRating > 0 ? getStars(profile.avgRating) : "☆☆☆☆☆"}
                  <span className="text-stone-800 ml-1">{profile.avgRating > 0 ? profile.avgRating.toFixed(1) : ""}</span>
                </div>
                <div className="text-xs text-stone-400 font-bold mt-1 uppercase tracking-widest">{profile.reviews.length} Reviews</div>
              </div>
              <div className="w-px h-8 bg-stone-200 hidden sm:block"></div>
              <div className="flex flex-col">
                <div className="font-extrabold text-lg text-stone-800">{profile.orderCount}</div>
                <div className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Consults</div>
              </div>
              <div className="w-px h-8 bg-stone-200 hidden sm:block"></div>
              <div className="flex flex-col">
                <div className="font-extrabold text-lg text-stone-800">{profile.experienceYears} Years</div>
                <div className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Experience</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {(profile.categories || []).map(c => (
                <span key={c} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-200/50">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio & Details Grid */}
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          <div className="sm:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-sm">
            <h2 className="text-lg font-extrabold text-stone-900 mb-4 uppercase tracking-widest">About Me</h2>
            <div className="text-stone-600 font-medium leading-relaxed whitespace-pre-line">
              {profile.bio || `Hello! I am ${profile.name}, a dedicated astrologer specializing in ${profile.speciality || 'Vedic Astrology'}. With over ${profile.experienceYears} years of experience, I strive to provide accurate and deeply insightful guidance to help you navigate life's challenges. Connect with me for clarity on love, career, and personal growth.`}
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm h-fit space-y-6">
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Languages</h3>
               <p className="font-bold text-stone-800">{profile.languages || "Hindi, English"}</p>
             </div>
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Availability</h3>
               {profile.isOnline ? (
                 <p className="font-bold text-emerald-600 flex items-center gap-1.5 border border-emerald-100 bg-emerald-50 w-fit px-3 py-1 rounded-lg">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                   Online Now
                 </p>
               ) : (
                 <p className="font-bold text-stone-500 flex items-center gap-1.5 border border-stone-200 bg-stone-100 w-fit px-3 py-1 rounded-lg">
                   <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                   Not Available
                 </p>
               )}
             </div>
             <div className="pt-4 border-t border-stone-100 hidden sm:block">
               {/* Desktop CTA */}
               <button 
                  onClick={startChat}
                  disabled={starting || !profile.isOnline}
                  className="w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold py-3.5 rounded-xl text-sm shadow-md shadow-amber-200/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:from-stone-200 disabled:to-stone-300 disabled:text-stone-500 disabled:shadow-none"
               >
                 {starting ? "Starting Chat..." : !profile.isOnline ? "Not Available" : `Chat Now (₹${profile.ratePerMin}/min)`}
               </button>
             </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
           <div className="flex items-center gap-2 mb-6">
             <span className="text-2xl text-[#f5c842]">⭐</span>
             <h2 className="text-xl font-extrabold text-stone-900 uppercase tracking-widest">User Reviews</h2>
           </div>

           {profile.reviews.length === 0 ? (
             <div className="bg-white rounded-3xl py-16 text-center border border-stone-100 shadow-sm">
               <div className="text-4xl mb-4 opacity-50 drop-shadow-sm">💭</div>
               <div className="text-stone-800 font-bold mb-1">No reviews yet</div>
               <div className="text-stone-500 text-sm font-medium">Be the first to consult with {profile.name}!</div>
             </div>
           ) : (
             <div className="space-y-4">
               {profile.reviews.map(r => (
                 <div key={r.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                     <div className="font-bold text-stone-800">{r.reviewerName}</div>
                     <div className="text-xs text-stone-400 font-semibold">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                   </div>
                   <div className="mb-3 flex text-[#16a34a] text-sm leading-none drop-shadow-sm">
                     {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                   </div>
                   <div className="text-stone-600 text-sm italic leading-relaxed">"{r.comment || "No written feedback provided."}"</div>
                 </div>
               ))}
             </div>
           )}
        </div>

      </main>

      {/* Floating Action Bar (Mobile Only) */}
      <div className="fixed bottom-14 left-0 right-0 sm:hidden bg-white/80 backdrop-blur-md border-t border-stone-200 p-4 pb-6 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
         <button 
            onClick={startChat}
            disabled={starting || !profile.isOnline}
            className="w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold py-4 rounded-2xl shadow-lg shadow-amber-200/50 active:scale-95 transition-all text-lg disabled:opacity-50 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:from-stone-200 disabled:to-stone-300 disabled:shadow-none"
         >
           {starting ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
           ) : "💬"}
           {starting ? "Starting..." : !profile.isOnline ? "Not Available" : `Chat Now · ₹${profile.ratePerMin}/min`}
         </button>
      </div>

      <MobileBottomNav />
      <UserFooter />
    </div>
  );
}
