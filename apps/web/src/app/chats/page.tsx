"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChatSummary {
  id: string;
  status: "ACTIVE" | "ENDED";
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  astrologer: {
    id: string;
    name: string;
    speciality: string | null;
    profileImage: string | null;
    ratePerMin: number;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  messageCount: number;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDuration(start: string, end: string | null): string {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function MyChatsPage() {
  const router = useRouter();

  const { data: chatsData, isLoading: loadingChats } = useSWR("/api/user/chats", fetcher);
  const { data: profile } = useSWR("/api/user/profile", fetcher);

  const sessions: ChatSummary[] = chatsData?.sessions || [];
  const myUserId: string | null = profile?.id ?? null;
  const loading = loadingChats;

  const handleContinue = async (astrologerId: string) => {
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ astrologerId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/dashboard/chat/${data.sessionId}`);
    } else if (res.status === 402) {
      router.push("/wallet");
    } else {
      alert(data.error || "Failed to resume chat");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] flex flex-col">
      <UserHeader />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#f5c842] text-lg">💬</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">My Chats</h1>
          </div>
          <p className="text-stone-500 text-sm font-medium ml-8">Your consultation history with astrologers</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 border border-stone-100 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-stone-200 rounded" />
                  <div className="h-3 w-48 bg-stone-100 rounded" />
                  <div className="h-3 w-24 bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 shadow-sm">
            <div className="text-5xl mb-4">🌙</div>
            <p className="text-stone-700 font-bold text-lg mb-1">No chats yet</p>
            <p className="text-stone-400 text-sm mb-6">Start a consultation with an astrologer to see your history here.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold rounded-xl shadow-md shadow-amber-200/50 hover:-translate-y-0.5 transition-all text-sm"
            >
              Browse Astrologers →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isActive = s.status === "ACTIVE";
              const lastMsg = s.lastMessage;
              const isMyMsg = lastMsg?.senderId === myUserId;
              const preview = lastMsg
                ? `${isMyMsg ? "You: " : ""}${lastMsg.content}`
                : "No messages yet";

              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/dashboard/chat/${s.id}`)}
                  className="group bg-white rounded-2xl p-4 flex gap-4 border border-stone-100 shadow-sm hover:shadow-md hover:border-[#f5c842]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full border-2 border-[#f5c842]/60 overflow-hidden bg-gradient-to-b from-[#fef3c7] to-[#fde68a] flex items-center justify-center">
                      {s.astrologer.profileImage ? (
                        <img
                          src={s.astrologer.profileImage}
                          alt={s.astrologer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👨🏽‍🦱</span>
                      )}
                    </div>
                    {/* Active pulse indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-stone-900 text-sm group-hover:text-[#d97706] transition-colors truncate">
                          {s.astrologer.name}
                        </p>
                        <p className="text-[11px] text-stone-400 font-medium truncate">
                          {s.astrologer.speciality ?? "Vedic Astrology"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
                          {lastMsg ? formatRelativeTime(lastMsg.createdAt) : formatRelativeTime(s.startedAt)}
                        </p>
                        {isActive && (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Last message preview */}
                    <p className="text-xs text-stone-500 mt-1 truncate">{preview}</p>

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium flex-wrap">
                        <span>🕐 {formatDuration(s.startedAt, s.endedAt)}</span>
                        <span>•</span>
                        <span>💬 {s.messageCount} msgs</span>
                        {s.totalCost > 0 && (
                          <>
                            <span>•</span>
                            <span>₹{s.totalCost.toFixed(0)}</span>
                          </>
                        )}
                      </div>

                      {/* Continue button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContinue(s.astrologer.id);
                        }}
                        className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 text-[11px] font-extrabold rounded-lg shadow-sm shadow-amber-200/50 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-200/70 transition-all active:scale-95"
                      >
                        {isActive ? "Rejoin →" : "Continue →"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <UserFooter />
      <MobileBottomNav />
    </div>
  );
}
