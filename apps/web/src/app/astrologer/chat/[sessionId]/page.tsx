"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import VedicLoader from "../../../../components/VedicLoader";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isMe: boolean;
}

const STARS = [
  { top: 8, left: 12, size: 2, delay: 0, dur: 3.2 },
  { top: 15, left: 78, size: 1.5, delay: 1.1, dur: 2.8 },
  { top: 23, left: 45, size: 2.5, delay: 0.5, dur: 4.1 },
  { top: 31, left: 91, size: 1, delay: 2.2, dur: 3.6 },
  { top: 42, left: 6, size: 2, delay: 0.8, dur: 2.5 },
  { top: 55, left: 33, size: 1.5, delay: 1.7, dur: 3.9 },
  { top: 67, left: 88, size: 2, delay: 0.3, dur: 2.7 },
  { top: 72, left: 55, size: 1, delay: 2.9, dur: 4.3 },
  { top: 81, left: 19, size: 2.5, delay: 0.6, dur: 3.1 },
  { top: 88, left: 73, size: 1.5, delay: 1.4, dur: 2.9 },
  { top: 5, left: 60, size: 1, delay: 3.1, dur: 3.8 },
  { top: 48, left: 97, size: 2, delay: 0.2, dur: 2.6 },
  { top: 35, left: 70, size: 1.5, delay: 1.9, dur: 4.0 },
  { top: 62, left: 42, size: 2.5, delay: 0.7, dur: 3.3 },
  { top: 19, left: 25, size: 1, delay: 2.5, dur: 2.4 },
  { top: 76, left: 8, size: 2, delay: 1.2, dur: 3.7 },
  { top: 93, left: 50, size: 1.5, delay: 0.4, dur: 4.2 },
  { top: 28, left: 83, size: 1, delay: 2.8, dur: 2.8 },
  { top: 58, left: 17, size: 2, delay: 1.6, dur: 3.5 },
  { top: 85, left: 37, size: 1.5, delay: 0.9, dur: 2.3 },
];

const ZODIAC = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

export default function AstrologerChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState("User");
  const [rate, setRate] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [latestMsgId, setLatestMsgId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // billingStarted = server has confirmed both parties are in the room and billing is active.
  // Timer only runs after this — prevents display drift when user hasn't joined yet.
  const [billingStarted, setBillingStarted] = useState(false);
  const [kundliProfile, setKundliProfile] = useState<{
    fullName: string; dateOfBirth: string; timeOfBirth: string; placeOfBirth: string;
  } | null>(null);
  const [showKundli, setShowKundli] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    // Only tick when billing is officially active (server confirmed both parties in room)
    if (ended || !connected || !billingStarted) return;
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const next = d + 1;
        setEarnings(Math.ceil(next / 60) * rate);
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, connected, billingStarted, rate]);

  useEffect(() => {
    let socket: Socket;
    async function init() {
      try {
        // Run all 3 fetches in parallel — none depend on each other's response
        const [sessionRes, profileRes, tokenRes] = await Promise.all([
          fetch(`/api/chat/session/${sessionId}`),
          fetch("/api/astrologer/profile"),
          fetch("/api/chat/socket-token"),
        ]);

        if (!sessionRes.ok) { setStatus("error"); return; }

        const [sessionData, profile, tokenData] = await Promise.all([
          sessionRes.json(),
          profileRes.json(),
          tokenRes.json(),
        ]);

        setUserName(sessionData.user?.name || "User");
        setRate(sessionData.astrologer?.ratePerMin || 0);
        if (sessionData.status === "ENDED") setEnded(true);
        setEarnings(sessionData.totalCost || 0);
        if (sessionData.user?.kundliProfile) setKundliProfile(sessionData.user.kundliProfile);

        // If billing was already running (reconnect scenario), seed billingStarted immediately.
        // totalCost > 0 means at least one minute has been charged in this session.
        if ((sessionData.totalCost || 0) > 0 && sessionData.status !== "ENDED") {
          setBillingStarted(true);
        }

        const uid = profile?.userId || profile?.id;
        if (uid) setMyUserId(uid);

        if (sessionData.messages?.length > 0) {
          const mapped = sessionData.messages.map((m: { id: string; senderId: string; content: string; createdAt: string }) => ({
            id: m.id, senderId: m.senderId, content: m.content,
            createdAt: new Date(m.createdAt), isMe: m.senderId === uid,
          }));
          setMessages(mapped);
          setLatestMsgId(mapped[mapped.length-1]?.id || null);
        }

        // Socket token already fetched — connect immediately
        const { token } = tokenData;
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"], timeout: 60000, reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 2000 });
        socketRef.current = socket;

        socket.on("connect", () => { setConnected(true); setStatus("ready"); socket.emit("join_session", { sessionId }); });
        socket.on("connect_error", () => setConnected(false));
        socket.on("disconnect", () => setConnected(false));

        socket.on("receive_message", (msg: { id: string; senderId: string; content: string; createdAt: string }) => {
          setMyUserId((uid) => {
            const isMe = msg.senderId === uid;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              setLatestMsgId(msg.id);
              return [...prev, { ...msg, createdAt: new Date(msg.createdAt), isMe }];
            });
            return uid;
          });
        });

        socket.on("user_typing", ({ isTyping: t }: { isTyping: boolean }) => {
          setIsTyping(t);
          if (t) { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000); }
        });
        socket.on("session_ended", () => { setEnded(true); if (timerRef.current) clearInterval(timerRef.current); });
        // Authoritative signal from server: both parties confirmed, billing is live
        socket.on("billing_started", () => setBillingStarted(true));

      } catch (err) { console.error(err); setStatus("error"); }
    }
    init();
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  function sendMessage() {
    if (!input.trim() || ended || !socketRef.current) return;
    socketRef.current.emit("send_message", { sessionId, content: input.trim() });
    socketRef.current.emit("typing", { sessionId, isTyping: false });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "56px";
  }

  function handleTyping(text: string) {
    setInput(text);
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { sessionId, isTyping: text.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (text.length > 0) typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit("typing", { sessionId, isTyping: false }); }, 2000);
  }

  function handleEndSession() {
    if (!socketRef.current) return;
    socketRef.current.emit("end_session", { sessionId });
    setEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const minsBilled = Math.ceil(duration / 60);
    setMessages((prev) => [...prev, {
      id: "ended-local", senderId: "system",
      content: `Session ended · ${Math.floor(duration / 60)}m ${duration % 60}s · ${minsBilled} min billed · Earned ₹${minsBilled * rate}`,
      createdAt: new Date(), isMe: false,
    }]);
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDuration = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  const styles = `
    @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.9;transform:scale(1.4)} }
    @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.07} 50%{transform:translate(40px,-30px) scale(1.15);opacity:.12} }
    @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.06} 50%{transform:translate(-30px,40px) scale(1.2);opacity:.1} }
    @keyframes breatheOm { 0%,100%{opacity:.04;transform:scale(1) rotate(0deg)} 50%{opacity:.07;transform:scale(1.04) rotate(-2deg)} }
    @keyframes msgIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,153,51,0)} 50%{box-shadow:0 0 0 8px rgba(255,153,51,0.18)} }
    @keyframes emeraldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 0 8px rgba(52,211,153,0.2)} }
    @keyframes sendGlow { 0%,100%{box-shadow:0 4px 18px rgba(255,153,51,.35)} 50%{box-shadow:0 4px 30px rgba(255,153,51,.65)} }
    @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.6} 40%{transform:translateY(-6px);opacity:1} }
    @keyframes zodiacFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.12} 50%{transform:translateY(-8px) rotate(8deg);opacity:.2} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes connBlink { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 0 5px rgba(52,211,153,0.25)} }
    @keyframes earningsCount { from{transform:scale(1.15);color:#10b981} to{transform:scale(1)} }
    .msg-in { animation: msgIn 0.35s cubic-bezier(.34,1.4,.64,1) both; }
  `;

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center bg-[#faf8f5]">
      <VedicLoader size="lg" text="Loading session…" />
    </div>
  );

  if (status === "error") return (
    <div className="flex flex-col h-screen items-center justify-center gap-4 bg-[#faf8f5] text-center p-4">
      <div className="text-6xl">🪐</div>
      <h2 className="font-cinzel font-bold text-slate-700">Could not connect</h2>
      <button onClick={() => router.push("/astrologer")} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold shadow-lg hover:scale-105 transition-all">← Back to Portal</button>
    </div>
  );

  const userInitial = (userName[0] || "U").toUpperCase();

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <header className="shrink-0 z-20 relative" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(245,200,66,0.22)", boxShadow: "0 2px 24px rgba(255,153,51,0.07)" }}>
        {/* Running shimmer on border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,153,51,0.5), rgba(245,200,66,0.6), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
          {/* Left: back + avatar + name — flex-1 + min-w-0 ensures name truncates before pushing right side off */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => router.push("/astrologer")} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#faf8f5] border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF9933] hover:border-[#FF9933]/30 transition-all text-base sm:text-lg font-bold shrink-0">←</button>
            <div className="relative shrink-0">
              {/* User avatar with purple ring */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-purple-200/60 flex items-center justify-center text-base sm:text-lg font-extrabold text-purple-500 shadow-sm"
                style={{ animation: connected ? "glowPulse 3s ease-in-out infinite" : "none", boxShadow: connected ? undefined : "none" }}>
                {userInitial}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${connected ? "bg-emerald-400" : "bg-red-400"}`}
                style={connected ? { animation: "connBlink 2s ease-in-out infinite" } : {}} />
            </div>
            <div className="min-w-0">
              <div className="text-slate-800 font-bold text-[13px] sm:text-[15px] tracking-tight leading-tight truncate">{userName}</div>
              <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-purple-400">✦ Seeker</div>
            </div>
            {/* Kundli toggle button — shorter label on mobile */}
            {kundliProfile && (
              <button
                onClick={() => setShowKundli((v) => !v)}
                className="shrink-0 ml-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all"
                style={{
                  background: showKundli ? "linear-gradient(135deg,#FF9933,#f5c842)" : "rgba(245,200,66,0.1)",
                  color: showKundli ? "#1a1040" : "#d97706",
                  border: "1px solid rgba(245,200,66,0.4)",
                }}>
                <span className="sm:hidden">🪐</span>
                <span className="hidden sm:inline">🪐 Kundli</span>
              </button>
            )}
          </div>

          {/* Right: Time + Earnings + End — shrink-0 so it never collapses */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Time: compact pill on mobile, full badge on sm+ */}
            <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-amber-400">Time</div>
              <div className="font-cinzel font-bold text-xs text-amber-600">{formatDuration(duration)}</div>
            </div>
            <div className="sm:hidden px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-center">
              <div className="font-cinzel font-bold text-[11px] text-amber-600">{formatDuration(duration)}</div>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center"
              style={{ animation: duration > 0 && duration % 60 === 0 ? "emeraldPulse 1s ease-out" : "none" }}>
              <div className="text-[8px] uppercase tracking-widest font-bold text-emerald-500">Earned</div>
              <div className="font-cinzel font-extrabold text-[11px] sm:text-xs text-emerald-600">₹{earnings.toFixed(0)}</div>
              <div className="text-[7px] text-emerald-400">{Math.ceil(duration / 60)} min</div>
            </div>
            <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-[#faf8f5] border border-[#f5c842]/30 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-[#FF9933]">Rate</div>
              <div className="font-cinzel font-bold text-xs text-slate-700">₹{rate}/min</div>
            </div>
            {/* End button — always visible, never hidden */}
            {!ended && (
              <button id="end-session-btn" onClick={handleEndSession}
                className="px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] uppercase tracking-widest font-extrabold bg-red-50 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:shadow-md whitespace-nowrap">
                End
              </button>
            )}
          </div>
        </div>

        {/* Kundli Panel */}
        {showKundli && kundliProfile && (
          <div className="px-4 py-3 border-t border-[#f5c842]/15" style={{ background: "linear-gradient(135deg,rgba(254,243,199,0.8),rgba(255,237,204,0.9))" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">🪐 Seeker&apos;s Kundli</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="text-amber-500 font-bold">Name: </span><span className="text-stone-700 font-semibold">{kundliProfile.fullName}</span></div>
              <div><span className="text-amber-500 font-bold">Born: </span><span className="text-stone-700 font-semibold">{new Date(kundliProfile.dateOfBirth + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
              <div><span className="text-amber-500 font-bold">Time: </span><span className="text-stone-700 font-semibold">{kundliProfile.timeOfBirth}</span></div>
              <div><span className="text-amber-500 font-bold">Place: </span><span className="text-stone-700 font-semibold">{kundliProfile.placeOfBirth}</span></div>
            </div>
          </div>
        )}

        {/* Zodiac strip */}
        <div className="px-4 py-1.5 border-t border-[#f5c842]/10 flex items-center justify-between overflow-hidden">
          <span className="text-[9px] font-bold tracking-widest text-purple-400">🔮 Astrologer View</span>
          <div className="flex gap-2.5">
            {ZODIAC.map((z, i) => (
              <span key={i} className="text-[11px] font-bold text-[#f5c842]/35 hover:text-[#f5c842]/70 transition-colors cursor-default">{z}</span>
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Guiding {userName.split(" ")[0]}</span>
        </div>
      </header>

      {/* ── MESSAGES AREA ── */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Aurora */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[5%] right-[5%] w-[320px] h-[320px] rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,1) 0%, transparent 70%)", animation: "aurora1 14s ease-in-out infinite" }} />
          <div className="absolute bottom-[10%] left-[5%] w-[280px] h-[280px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,200,66,1) 0%, transparent 70%)", animation: "aurora2 10s ease-in-out infinite" }} />
        </div>

        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, background: i % 3 === 0 ? "#a78bfa" : "#f5c842", animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        {/* ॐ watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ animation: "breatheOm 8s ease-in-out infinite" }}>
          <span className="text-[#FF9933] font-bold" style={{ fontSize: "220px", lineHeight: 1 }}>ॐ</span>
        </div>

        <div className="relative z-10 px-4 py-5 space-y-4">
          {messages.length === 0 && !ended && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white border border-[#f5c842]/25 shadow-[0_8px_32px_rgba(167,139,250,0.15)] flex items-center justify-center text-4xl"
                style={{ animation: "zodiacFloat 4s ease-in-out infinite" }}>
                🌟
              </div>
              <div>
                <p className="font-cinzel font-bold text-slate-700 text-base mb-1">Session is live</p>
                <p className="text-slate-400 text-sm">Await the seeker's message and begin your reading ✨</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isSystem = msg.senderId === "system";
            const isLatest = msg.id === latestMsgId;

            if (isSystem) {
              return (
                <div key={msg.id} className={`flex justify-center my-3 ${isLatest ? "msg-in" : ""}`}>
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-[#f5c842]/25 shadow-sm backdrop-blur-sm">
                    <span className="text-[#f5c842] text-xs" style={{ animation: "twinkle 2s ease-in-out infinite" }}>✦</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{msg.content}</span>
                    <span className="text-[#f5c842] text-xs" style={{ animation: "twinkle 2s ease-in-out 0.3s infinite" }}>✦</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2.5 msg-in ${msg.isMe ? "justify-end" : "justify-start"}`}>
                {!msg.isMe && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-purple-200/60 flex items-center justify-center text-sm font-extrabold text-purple-500 shrink-0 mt-auto shadow-sm">
                    {userInitial}
                  </div>
                )}
                <div className={`max-w-[78%] lg:max-w-md flex flex-col gap-1.5 ${msg.isMe ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3.5 rounded-2xl text-[14.5px] leading-relaxed font-medium ${
                    msg.isMe
                      ? "bg-gradient-to-br from-[#FF9933] to-[#f0a832] text-white rounded-br-sm"
                      : "bg-white/90 backdrop-blur-sm border border-white/60 text-slate-800 rounded-bl-sm shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
                  }`} style={msg.isMe ? { boxShadow: "0 4px 24px rgba(255,153,51,0.30)" } : {}}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 px-1">{formatTime(msg.createdAt)}</span>
                </div>
                {msg.isMe && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border-2 border-[#f5c842]/30 flex items-center justify-center text-xl shrink-0 mt-auto shadow-sm">
                    🔮
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start msg-in">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-purple-200/60 flex items-center justify-center text-sm font-extrabold text-purple-500 shrink-0 mt-auto shadow-sm">
                {userInitial}
              </div>
              <div className="bg-white/90 border border-white/60 backdrop-blur-sm rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full"
                    style={{ background: `linear-gradient(135deg, #a78bfa, #7c3aed)`, animation: `dotBounce 1s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {ended && (
            <div className="flex justify-center pt-8 pb-4 msg-in">
              <button id="back-to-astrologer-btn" onClick={() => router.push("/astrologer")}
                className="px-8 py-3.5 rounded-2xl bg-white border border-[#FF9933]/25 text-[#FF9933] font-bold uppercase tracking-widest text-xs transition-all shadow-sm hover:bg-gradient-to-r hover:from-[#FF9933] hover:to-[#f5c842] hover:text-white hover:shadow-[0_4px_24px_rgba(255,153,51,0.35)] hover:scale-105">
                ← Back to Portal
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      {!ended && (
        <div className="shrink-0 px-4 py-3.5 z-20" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(245,200,66,0.18)" }}>
          <div className="flex gap-3 items-end max-w-5xl mx-auto">
            <textarea
              id="astro-chat-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                handleTyping(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Share your astrological insight… ✦ Enter to send"
              className="flex-1 px-5 py-4 rounded-2xl text-[14.5px] font-medium resize-none overflow-hidden bg-[#faf8f5] border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/15 transition-all"
              style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="astro-send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 font-bold text-xl ${
                input.trim()
                  ? "bg-gradient-to-tr from-[#FF9933] to-[#f5c842] text-white hover:scale-110"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
              style={input.trim() ? { animation: "sendGlow 2s ease-in-out infinite" } : {}}
            >
              ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
