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

const ZODIAC = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

export default function UserChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [astrologerJoined, setAstrologerJoined] = useState(false);
  const [waitingTimeLeft, setWaitingTimeLeft] = useState(600);
  const [waitTimeOver, setWaitTimeOver] = useState(false);
  const [astrologerName, setAstrologerName] = useState("Astrologer");
  const [astrologerId, setAstrologerId] = useState("");
  const [rate, setRate] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const endSessionEarly = useCallback(() => {
    if (socketRef.current) socketRef.current.emit("end_session", { sessionId });
    setEnded(true);
    router.push("/dashboard");
  }, [sessionId, router]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (ended || !connected || !astrologerJoined) return;
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, connected, astrologerJoined]);

  useEffect(() => {
    if (ended || astrologerJoined) return;
    const interval = setInterval(() => {
      setWaitingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setWaitTimeOver(true);
          if (socketRef.current) socketRef.current.emit("end_session", { sessionId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ended, astrologerJoined, sessionId]);

  useEffect(() => {
    let socket: Socket;
    async function init() {
      try {
        const sessionRes = await fetch(`/api/chat/session/${sessionId}`);
        if (!sessionRes.ok) { setStatus("error"); return; }
        const sessionData = await sessionRes.json();

        setAstrologerName(sessionData.astrologer?.user?.name || "Astrologer");
        setAstrologerId(sessionData.astrologer?.id || "");
        setRate(sessionData.astrologer?.ratePerMin || 0);
        if (sessionData.review) setReviewSubmitted(true);
        setBalance(sessionData.user?.walletBalance || 0);
        if (sessionData.status === "ENDED") setEnded(true);

        const createdMs = new Date(sessionData.createdAt).getTime();
        const elapsedSecs = Math.floor((Date.now() - createdMs) / 1000);
        const rem = Math.max(0, 600 - elapsedSecs);
        setWaitingTimeLeft(rem);
        if (rem === 0 && sessionData.status !== "ENDED") setWaitTimeOver(true);

        const profileRes = await fetch("/api/user/profile");
        const profile = await profileRes.json();
        const uid = profile?.id;
        if (uid) setMyUserId(uid);

        if (sessionData.messages?.length > 0) {
          setAstrologerJoined(true);
          setMessages(sessionData.messages.map((m: { id: string; senderId: string; content: string; createdAt: string }) => ({
            id: m.id, senderId: m.senderId, content: m.content,
            createdAt: new Date(m.createdAt), isMe: m.senderId === uid,
          })));
        }

        const tokenRes = await fetch("/api/chat/socket-token");
        if (!tokenRes.ok) { setStatus("error"); return; }
        const { token } = await tokenRes.json();

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
              return [...prev, { ...msg, createdAt: new Date(msg.createdAt), isMe }];
            });
            return uid;
          });
        });

        socket.on("user_typing", ({ isTyping: t }: { isTyping: boolean }) => {
          setIsTyping(t);
          if (t) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        });

        socket.on("balance_update", ({ balance: b }: { balance: number }) => setBalance(b));
        socket.on("session_ended", () => { setEnded(true); if (timerRef.current) clearInterval(timerRef.current); });
        socket.on("astrologer_joined", () => setAstrologerJoined(true));
        socket.on("session_cancelled", () => {
          setEnded(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setMessages((prev) => [...prev, { id: "cancelled-notice", senderId: "system", content: "The astrologer has declined this session. You have not been charged.", createdAt: new Date(), isMe: false }]);
        });
        socket.on("error", ({ message }: { message: string }) => console.error("[Socket] Error:", message));

        const pollWait = setInterval(async () => {
          if (astrologerJoined || ended) { clearInterval(pollWait); return; }
          try {
            const r = await fetch(`/api/chat/session/${sessionId}`);
            if (!r.ok) return;
            const d = await r.json();
            if (d.status === "ENDED") { setEnded(true); clearInterval(pollWait); }
            else if (d.messages?.length > 0) { setAstrologerJoined(true); clearInterval(pollWait); }
          } catch { /* ignore */ }
        }, 5000);

      } catch (err) {
        console.error("[Chat] Init error:", err);
        setStatus("error");
      }
    }
    init();
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((d) => { if (d?.id) setMyUserId(d.id); }).catch(() => {});
  }, []);

  function sendMessage() {
    if (!input.trim() || ended || !socketRef.current) return;
    socketRef.current.emit("send_message", { sessionId, content: input.trim() });
    socketRef.current.emit("typing", { sessionId, isTyping: false });
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "56px"; }
  }

  function handleTyping(text: string) {
    setInput(text);
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { sessionId, isTyping: text.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit("typing", { sessionId, isTyping: false }); }, 1000);
    }
  }

  const submitReview = async () => {
    if (rating === 0) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/chat/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, astrologerId, rating, comment }) });
      if (res.ok) { setReviewSubmitted(true); setTimeout(() => router.push("/dashboard"), 1500); }
    } catch (e) { console.error(e); } finally { setIsSubmittingReview(false); }
  };

  function handleEndSession() {
    if (!socketRef.current) return;
    socketRef.current.emit("end_session", { sessionId });
    setEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setMessages((prev) => [...prev, { id: "ended-local", senderId: "system", content: `Session ended · ${Math.floor(duration / 60)}m ${duration % 60}s`, createdAt: new Date(), isMe: false }]);
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDuration = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#faf8f5]">
        <VedicLoader size="lg" text="Connecting to your cosmos…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f5] p-4 text-center">
        <div className="text-5xl mb-4">🪐</div>
        <h2 className="text-xl font-cinzel font-bold text-slate-700 mb-2">Connection Lost</h2>
        <p className="text-slate-500 mb-6 text-sm">Failed to reach the chat server</p>
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ─── Waiting screen ────────────────────────────────────────────────────────
  if (!astrologerJoined && !ended && !waitTimeOver) {
    const mins = Math.floor(waitingTimeLeft / 60);
    const secs = waitingTimeLeft % 60;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f5] relative overflow-hidden p-4">
        {/* Subtle cosmic background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%)" }} />
          {ZODIAC.map((sign, i) => (
            <div key={i} className="absolute text-[#f5c842]/10 font-bold select-none"
              style={{ fontSize: `${14 + (i % 4) * 6}px`, top: `${10 + (i * 7.5)}%`, left: `${5 + (i * 8)}%`, transform: `rotate(${i * 30}deg)` }}>
              {sign}
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[#FF9933]/5 font-bold" style={{ fontSize: "320px", lineHeight: 1 }}>ॐ</span>
          </div>
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-[#f5c842]/25 p-10 rounded-3xl flex flex-col items-center text-center max-w-sm w-full shadow-[0_8px_40px_rgba(245,200,66,0.12)]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#f5c842] flex items-center justify-center text-4xl shadow-lg mb-6">
            🔮
          </div>
          <h2 className="text-2xl font-cinzel font-bold text-slate-800 mb-1">Awaiting Your Guide</h2>
          <p className="text-slate-500 text-sm mb-6">Connecting you to <strong className="text-[#FF9933]">{astrologerName}</strong>…</p>

          <div className="w-full bg-[#faf8f5] border border-[#f5c842]/20 rounded-2xl px-6 py-4 mb-6">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Session Expires In</div>
            <div className="text-4xl font-cinzel font-bold text-slate-800">
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#f5c842] animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-[#f5c842] animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>

          <button onClick={endSessionEarly} className="text-slate-400 hover:text-red-400 text-sm transition-colors underline underline-offset-4">
            Cancel Session
          </button>
        </div>
      </div>
    );
  }

  // ─── Timeout screen ────────────────────────────────────────────────────────
  if (!astrologerJoined && waitTimeOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f5] p-4 text-center">
        <div className="text-5xl mb-4">⌛</div>
        <h2 className="text-xl font-cinzel font-bold text-slate-800 mb-2">Astrologer Unavailable</h2>
        <p className="text-slate-500 mb-6 max-w-sm text-sm">The astrologer did not respond within 10 minutes. The session has been cancelled — you have not been charged.</p>
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── Active chat ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>

      {/* ── REVIEW OVERLAY ── */}
      {ended && astrologerJoined && !reviewSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,6,18,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="bg-white border border-[#f5c842]/20 p-8 rounded-3xl w-full max-w-md flex flex-col items-center shadow-2xl">
            <div className="text-5xl mb-3">⭐</div>
            <h2 className="text-2xl font-cinzel font-extrabold text-slate-800 mb-1">Rate Your Session</h2>
            <p className="text-slate-500 text-sm mb-5 text-center">How was your consultation with <strong className="text-[#FF9933]">{astrologerName}</strong>?</p>

            <div className="bg-[#faf8f5] border border-slate-100 rounded-2xl p-4 mb-6 w-full text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Duration</span>
                <span className="text-slate-700 font-bold">{Math.floor(duration / 60)}m {duration % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Cost</span>
                <span className="text-[#FF9933] font-extrabold font-cinzel text-lg">₹{(Math.max(1, Math.ceil(duration / 60)) * rate).toFixed(0)}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}
                  className="text-4xl transition-all hover:scale-125 focus:outline-none">
                  <span className={star <= (hoverRating || rating) ? "text-[#f5c842] drop-shadow-sm" : "text-slate-200"}>★</span>
                </button>
              ))}
            </div>

            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience (optional)…"
              className="w-full bg-[#faf8f5] border border-slate-200 rounded-2xl p-4 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/20 mb-5 font-medium text-sm" rows={3} />

            <div className="flex w-full gap-3">
              <button onClick={() => router.push("/dashboard")} className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm font-bold">
                Skip
              </button>
              <button disabled={rating === 0 || isSubmittingReview} onClick={submitReview}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white disabled:opacity-50 transition-all text-sm font-extrabold shadow-md hover:shadow-lg">
                {isSubmittingReview ? "Submitting…" : "Submit ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="shrink-0 z-20" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(245,200,66,0.2)", boxShadow: "0 2px 16px rgba(245,200,66,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="w-9 h-9 rounded-xl bg-[#faf8f5] border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF9933] hover:border-[#FF9933]/30 transition-all text-lg">
              ←
            </button>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF9933]/20 to-[#f5c842]/20 border-2 border-[#f5c842]/30 flex items-center justify-center text-xl shadow-sm">
                🧘
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${connected ? "bg-emerald-400" : "bg-red-400"}`} style={connected ? { boxShadow: "0 0 6px #34d399" } : {}} />
            </div>
            <div>
              <div className="text-slate-800 font-bold text-[15px] tracking-tight">{astrologerName}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#FF9933]">🔮 Astrologer</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-amber-400">Time</div>
              <div className="font-cinzel font-bold text-xs text-amber-600">{formatDuration(duration)}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-center border ${balance < rate * 2 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
              <div className={`text-[8px] uppercase tracking-widest font-bold ${balance < rate * 2 ? "text-red-400" : "text-emerald-500"}`}>₹ Balance</div>
              <div className={`font-cinzel font-bold text-xs ${balance < rate * 2 ? "text-red-500" : "text-emerald-600"}`}>₹{balance.toFixed(0)}</div>
            </div>
            {!ended && (
              <button id="end-chat-btn" onClick={handleEndSession}
                className="px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-extrabold bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all">
                End
              </button>
            )}
          </div>
        </div>

        {/* Zodiac strip */}
        <div className="px-4 py-1.5 border-t border-[#f5c842]/10 flex items-center justify-between overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF9933]">₹{rate}/min</span>
          <div className="flex gap-3">
            {ZODIAC.slice(0, 8).map((z, i) => (
              <span key={i} className="text-[10px] text-[#f5c842]/40 font-bold">{z}</span>
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">CosmicInsight</span>
        </div>
      </header>

      {/* Low balance warning */}
      {astrologerJoined && !ended && rate > 0 && balance > 0 && balance < rate * 2 && (
        <div className="mx-4 mt-3 shrink-0 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="uppercase tracking-widest text-[9px] mb-0.5">Low Balance</div>
            Less than 1 minute remaining — top up to continue!
          </div>
        </div>
      )}

      {/* ── MESSAGES AREA ── */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[#FF9933]/[0.04] font-bold" style={{ fontSize: "200px", lineHeight: 1 }}>ॐ</span>
        </div>

        <div className="relative z-10 px-4 py-5 space-y-4">
          {messages.length === 0 && !ended && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9933]/10 to-[#f5c842]/10 border border-[#f5c842]/20 flex items-center justify-center text-3xl mb-4 shadow-sm">
                🪷
              </div>
              <p className="font-cinzel font-bold text-slate-700 text-sm mb-1">Your session has begun</p>
              <p className="text-slate-400 text-xs">Say Namaste and start your cosmic journey ✨</p>
            </div>
          )}

          {messages.map((msg) => {
            const isSystem = msg.senderId === "system";
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#f5c842]/20 shadow-sm max-w-xs">
                    <span className="text-[#f5c842] text-xs">✦</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{msg.content}</span>
                    <span className="text-[#f5c842] text-xs">✦</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2.5 ${msg.isMe ? "justify-end" : "justify-start"}`}>
                {!msg.isMe && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border border-[#f5c842]/25 flex items-center justify-center text-lg shrink-0 mt-auto shadow-sm">
                    🧘
                  </div>
                )}
                <div className={`max-w-[78%] lg:max-w-md flex flex-col gap-1 ${msg.isMe ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed font-medium shadow-sm ${
                    msg.isMe
                      ? "bg-gradient-to-br from-[#FF9933] to-[#f0a832] text-white rounded-br-sm shadow-[0_4px_20px_rgba(255,153,51,0.25)]"
                      : "bg-white border border-slate-100/80 text-slate-800 rounded-bl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] tracking-widest font-semibold text-slate-300 px-1">{formatTime(msg.createdAt)}</span>
                </div>
                {msg.isMe && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border border-[#f5c842]/25 flex items-center justify-center text-sm shrink-0 mt-auto font-bold text-[#FF9933] shadow-sm">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border border-[#f5c842]/25 flex items-center justify-center text-lg shrink-0 mt-auto shadow-sm">
                🧘
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5 shadow-sm">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-gradient-to-b from-[#f5c842] to-[#FF9933] animate-bounce"
                    style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
          )}

          {ended && (
            <div className="flex justify-center pt-8 pb-4">
              <button id="back-to-dashboard-btn" onClick={() => router.push("/dashboard")}
                className="px-8 py-3.5 rounded-2xl bg-white border border-[#FF9933]/25 text-[#FF9933] hover:bg-gradient-to-r hover:from-[#FF9933] hover:to-[#f5c842] hover:text-white hover:border-transparent font-bold uppercase tracking-widest text-xs transition-all shadow-sm hover:shadow-md">
                ← Return to Dashboard
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      {!ended && (
        <div className="shrink-0 px-4 py-3 z-20" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(245,200,66,0.15)" }}>
          <div className="flex gap-2.5 items-end max-w-5xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                id="chat-input"
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  handleTyping(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Ask the stars… (Enter to send)"
                className="w-full px-5 py-4 rounded-2xl text-[14.5px] font-medium resize-none overflow-hidden bg-[#faf8f5] border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/15 transition-all"
                style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
              />
            </div>
            <button
              id="send-message-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 font-bold text-lg ${
                input.trim()
                  ? "bg-gradient-to-tr from-[#FF9933] to-[#f5c842] text-white shadow-md hover:shadow-[0_4px_20px_rgba(255,153,51,0.4)] hover:scale-105"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
