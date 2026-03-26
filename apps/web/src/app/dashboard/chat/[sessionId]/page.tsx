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

// Fixed star positions to avoid hydration mismatch
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
  const [latestMsgId, setLatestMsgId] = useState<string | null>(null);

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
        const rem = Math.max(0, 600 - Math.floor((Date.now() - createdMs) / 1000));
        setWaitingTimeLeft(rem);
        if (rem === 0 && sessionData.status !== "ENDED") setWaitTimeOver(true);

        const profileRes = await fetch("/api/user/profile");
        const profile = await profileRes.json();
        const uid = profile?.id;
        if (uid) setMyUserId(uid);

        if (sessionData.messages?.length > 0) {
          setAstrologerJoined(true);
          const mapped = sessionData.messages.map((m: { id: string; senderId: string; content: string; createdAt: string }) => ({
            id: m.id, senderId: m.senderId, content: m.content,
            createdAt: new Date(m.createdAt), isMe: m.senderId === uid,
          }));
          setMessages(mapped);
          setLatestMsgId(mapped[mapped.length - 1]?.id || null);
        }

        const { token } = await (await fetch("/api/chat/socket-token")).json();
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
              const next = [...prev, { ...msg, createdAt: new Date(msg.createdAt), isMe }];
              setLatestMsgId(msg.id);
              return next;
            });
            return uid;
          });
        });

        socket.on("user_typing", ({ isTyping: t }: { isTyping: boolean }) => {
          setIsTyping(t);
          if (t) { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000); }
        });
        socket.on("balance_update", ({ balance: b }: { balance: number }) => setBalance(b));
        socket.on("session_ended", () => { setEnded(true); if (timerRef.current) clearInterval(timerRef.current); });
        socket.on("astrologer_joined", () => setAstrologerJoined(true));
        socket.on("session_cancelled", () => {
          setEnded(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setMessages((prev) => [...prev, { id: "cancelled-notice", senderId: "system", content: "The astrologer has declined this session. You have not been charged.", createdAt: new Date(), isMe: false }]);
        });

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

      } catch (err) { console.error(err); setStatus("error"); }
    }
    init();
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => { if (d?.id) setMyUserId(d.id); }).catch(() => {});
  }, []);

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
    if (text.length > 0) typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit("typing", { sessionId, isTyping: false }); }, 1500);
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

  // ─── CSS animations ───────────────────────────────────────────────────────
  const styles = `
    @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.9;transform:scale(1.4)} }
    @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.07} 50%{transform:translate(40px,-30px) scale(1.15);opacity:.12} }
    @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.06} 50%{transform:translate(-30px,40px) scale(1.2);opacity:.1} }
    @keyframes aurora3 { 0%,100%{transform:translate(0,0) scale(1.05);opacity:.05} 60%{transform:translate(20px,20px) scale(0.95);opacity:.09} }
    @keyframes breatheOm { 0%,100%{opacity:.04;transform:scale(1) rotate(0deg)} 50%{opacity:.07;transform:scale(1.04) rotate(2deg)} }
    @keyframes msgIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes msgInMe { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,153,51,0)} 50%{box-shadow:0 0 0 8px rgba(255,153,51,0.18)} }
    @keyframes sendGlow { 0%,100%{box-shadow:0 4px 18px rgba(255,153,51,.35)} 50%{box-shadow:0 4px 30px rgba(255,153,51,.65)} }
    @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.6} 40%{transform:translateY(-6px);opacity:1} }
    @keyframes zodiacFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.12} 50%{transform:translateY(-8px) rotate(8deg);opacity:.2} }
    @keyframes ringRotate { to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes connBlink { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 0 5px rgba(52,211,153,0.25)} }
    .msg-in { animation: msgIn 0.35s cubic-bezier(.34,1.4,.64,1) both; }
    .msg-in-me { animation: msgInMe 0.35s cubic-bezier(.34,1.4,.64,1) both; }
  `;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center bg-[#faf8f5]">
      <VedicLoader size="lg" text="Connecting to your cosmos…" />
    </div>
  );

  if (status === "error") return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#faf8f5] gap-4 text-center p-4">
      <div className="text-6xl">🪐</div>
      <h2 className="text-xl font-cinzel font-bold text-slate-700">Connection Lost</h2>
      <p className="text-slate-400 text-sm">Could not reach the chat server</p>
      <button onClick={() => router.push("/dashboard")} className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">← Dashboard</button>
    </div>
  );

  // ─── Waiting screen ────────────────────────────────────────────────────────
  if (!astrologerJoined && !ended && !waitTimeOver) {
    const mins = Math.floor(waitingTimeLeft / 60);
    const secs = waitingTimeLeft % 60;
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#faf8f5]">
        <style>{styles}</style>

        {/* Aurora blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,153,51,1) 0%, transparent 70%)", animation: "aurora1 9s ease-in-out infinite" }} />
          <div className="absolute bottom-[15%] right-[10%] w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,200,66,1) 0%, transparent 70%)", animation: "aurora2 12s ease-in-out infinite" }} />
          <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full -translate-x-1/2 -translate-y-1/2" style={{ background: "radial-gradient(circle, rgba(255,200,100,1) 0%, transparent 70%)", animation: "aurora3 7s ease-in-out infinite" }} />
        </div>

        {/* Twinkling stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-[#f5c842] pointer-events-none"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        {/* Floating zodiac signs */}
        {ZODIAC.map((z, i) => (
          <div key={i} className="absolute font-bold pointer-events-none select-none text-[#FF9933]"
            style={{ fontSize: `${13 + (i % 3) * 5}px`, top: `${8 + (i * 7.5)}%`, left: `${3 + (i * 8)}%`, animation: `zodiacFloat ${4 + i * 0.3}s ease-in-out ${i * 0.4}s infinite` }}>
            {z}
          </div>
        ))}

        {/* Center ॐ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ animation: "breatheOm 6s ease-in-out infinite" }}>
          <span className="text-[#FF9933] font-bold" style={{ fontSize: "280px", lineHeight: 1 }}>ॐ</span>
        </div>

        <div className="relative z-10 bg-white/75 backdrop-blur-2xl border border-white/60 p-10 rounded-3xl flex flex-col items-center text-center max-w-sm w-full shadow-[0_20px_60px_rgba(255,153,51,0.15)]">
          <div className="relative mb-6">
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: "conic-gradient(from 0deg, #FF9933, #f5c842, #FF9933)", animation: "ringRotate 3s linear infinite", padding: "2.5px", borderRadius: "18px" }}>
              <div className="w-full h-full bg-white rounded-2xl" />
            </div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF9933]/20 to-[#f5c842]/20 flex items-center justify-center text-5xl z-10">
              🔮
            </div>
          </div>

          <h2 className="text-2xl font-cinzel font-bold text-slate-800 mb-1">Awaiting Your Guide</h2>
          <p className="text-slate-500 text-sm mb-6">Connecting you to <strong className="text-[#FF9933]">{astrologerName}</strong>…</p>

          <div className="w-full bg-[#faf8f5] border border-[#f5c842]/25 rounded-2xl px-6 py-4 mb-6" style={{ animation: "glowPulse 2.5s ease-in-out infinite" }}>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Session expires in</div>
            <div className="text-5xl font-cinzel font-bold text-slate-800">{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {[0, 0.2, 0.4].map((d, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#f5c842] to-[#FF9933]"
                style={{ animation: `dotBounce 1.2s ease-in-out ${d}s infinite` }} />
            ))}
          </div>

          <button onClick={endSessionEarly} className="text-slate-400 hover:text-red-400 text-sm transition-colors underline underline-offset-4">Cancel session</button>
        </div>
      </div>
    );
  }

  if (!astrologerJoined && waitTimeOver) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f5] p-4 text-center gap-4">
      <div className="text-6xl">⌛</div>
      <h2 className="text-xl font-cinzel font-bold text-slate-700">Astrologer Unavailable</h2>
      <p className="text-slate-400 text-sm max-w-xs">No response within 10 minutes. Session cancelled — you were not charged.</p>
      <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold shadow-lg hover:scale-105 transition-all">← Dashboard</button>
    </div>
  );

  // ─── Active chat ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{styles}</style>

      {/* ── REVIEW OVERLAY ── */}
      {ended && astrologerJoined && !reviewSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(250,248,245,0.85)", backdropFilter: "blur(16px)" }}>
          {/* Stars in background of overlay */}
          {STARS.slice(0, 10).map((s, i) => (
            <div key={i} className="absolute rounded-full bg-[#f5c842] pointer-events-none"
              style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
          ))}
          <div className="relative z-10 bg-white border border-[#f5c842]/20 p-8 rounded-3xl w-full max-w-md flex flex-col items-center shadow-[0_20px_60px_rgba(255,153,51,0.15)]">
            <div className="text-5xl mb-3" style={{ animation: "zodiacFloat 3s ease-in-out infinite" }}>⭐</div>
            <h2 className="text-2xl font-cinzel font-extrabold text-slate-800 mb-1">Rate Your Session</h2>
            <p className="text-slate-500 text-sm mb-5 text-center">How was your consultation with <strong className="text-[#FF9933]">{astrologerName}</strong>?</p>

            <div className="bg-[#faf8f5] border border-slate-100 rounded-2xl p-4 mb-5 w-full text-sm">
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Duration</span>
                <span className="text-slate-700 font-bold">{Math.floor(duration / 60)}m {duration % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Cost</span>
                <span className="text-[#FF9933] font-extrabold font-cinzel text-lg">₹{(Math.max(1, Math.ceil(duration / 60)) * rate).toFixed(0)}</span>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}
                  className="text-4xl transition-all focus:outline-none"
                  style={{ transform: star <= (hoverRating || rating) ? "scale(1.3)" : "scale(1)", filter: star <= (hoverRating || rating) ? "drop-shadow(0 0 6px rgba(245,200,66,0.7))" : "none" }}>
                  <span className={star <= (hoverRating || rating) ? "text-[#f5c842]" : "text-slate-200"}>★</span>
                </button>
              ))}
            </div>

            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience (optional)…"
              className="w-full bg-[#faf8f5] border border-slate-200 rounded-2xl p-4 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/15 mb-5 font-medium text-sm" rows={3} />

            <div className="flex w-full gap-3">
              <button onClick={() => router.push("/dashboard")} className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm font-bold">Skip</button>
              <button disabled={rating === 0 || isSubmittingReview} onClick={submitReview}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white disabled:opacity-50 text-sm font-extrabold shadow-md hover:shadow-[0_4px_24px_rgba(255,153,51,0.4)] hover:scale-[1.02] transition-all">
                {isSubmittingReview ? "Submitting…" : "Submit ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="shrink-0 z-20 relative" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(245,200,66,0.22)", boxShadow: "0 2px 24px rgba(255,153,51,0.07)" }}>
        {/* Shimmer line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.6), rgba(255,153,51,0.4), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="w-9 h-9 rounded-xl bg-[#faf8f5] border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF9933] hover:border-[#FF9933]/30 transition-all text-lg font-bold hover:scale-110">
              ←
            </button>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9933]/20 to-[#f5c842]/20 border-2 border-[#f5c842]/40 flex items-center justify-center text-2xl shadow-sm"
                style={{ animation: connected ? "glowPulse 3s ease-in-out infinite" : "none" }}>
                🧘
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${connected ? "bg-emerald-400" : "bg-red-400"}`}
                style={connected ? { animation: "connBlink 2s ease-in-out infinite" } : {}} />
            </div>
            <div>
              <div className="text-slate-800 font-bold text-[15px] tracking-tight leading-tight">{astrologerName}</div>
              <div className="text-[10px] font-bold tracking-widest" style={{ background: "linear-gradient(90deg,#FF9933,#f5c842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                🔮 Astrologer
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-amber-400">Time</div>
              <div className="font-cinzel font-bold text-xs text-amber-600">{formatDuration(duration)}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-center border transition-colors ${balance < rate * 2 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-100"}`}
              style={balance < rate * 2 ? { animation: "glowPulse 1.5s ease-in-out infinite" } : {}}>
              <div className={`text-[8px] uppercase tracking-widest font-bold ${balance < rate * 2 ? "text-red-400" : "text-emerald-500"}`}>₹ Bal</div>
              <div className={`font-cinzel font-bold text-xs ${balance < rate * 2 ? "text-red-500" : "text-emerald-600"}`}>₹{balance.toFixed(0)}</div>
            </div>
            {!ended && (
              <button id="end-chat-btn" onClick={handleEndSession}
                className="px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-extrabold bg-red-50 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:shadow-md">
                End
              </button>
            )}
          </div>
        </div>

        {/* Zodiac strip */}
        <div className="px-4 py-1.5 border-t border-[#f5c842]/10 flex items-center justify-between overflow-hidden">
          <span className="text-[9px] font-bold tracking-widest" style={{ background: "linear-gradient(90deg,#FF9933,#f5c842)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{rate}/min</span>
          <div className="flex gap-2.5">
            {ZODIAC.map((z, i) => (
              <span key={i} className="text-[11px] font-bold text-[#f5c842]/35 hover:text-[#f5c842]/70 transition-colors cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}>{z}</span>
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">CosmicInsight</span>
        </div>
      </header>

      {/* Low balance war */}
      {astrologerJoined && !ended && rate > 0 && balance > 0 && balance < rate * 2 && (
        <div className="mx-4 mt-3 shrink-0 bg-amber-50 border border-amber-300 text-amber-700 px-4 py-2.5 rounded-2xl flex items-center gap-3 font-bold shadow-sm"
          style={{ animation: "glowPulse 1.5s ease-in-out infinite" }}>
          <span className="text-xl">⚠️</span>
          <div className="text-sm">
            <div className="uppercase tracking-widest text-[9px] mb-0.5">Low Balance</div>
            Less than 1 minute left — top up to continue!
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Aurora blobs inside chat area */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,153,51,1) 0%, transparent 70%)", animation: "aurora1 12s ease-in-out infinite" }} />
          <div className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,200,66,1) 0%, transparent 70%)", animation: "aurora2 15s ease-in-out infinite" }} />
        </div>

        {/* Twinkling stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-[#f5c842] pointer-events-none"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        {/* ॐ watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ animation: "breatheOm 8s ease-in-out infinite" }}>
          <span className="text-[#FF9933] font-bold" style={{ fontSize: "220px", lineHeight: 1 }}>ॐ</span>
        </div>

        <div className="relative z-10 px-4 py-5 space-y-4">
          {messages.length === 0 && !ended && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white border border-[#f5c842]/25 flex items-center justify-center text-4xl shadow-[0_8px_32px_rgba(245,200,66,0.15)]"
                style={{ animation: "zodiacFloat 4s ease-in-out infinite" }}>
                🪷
              </div>
              <div>
                <p className="font-cinzel font-bold text-slate-700 text-base mb-1">Your session has begun</p>
                <p className="text-slate-400 text-sm">Send your first message to begin the cosmic journey ✨</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isSystem = msg.senderId === "system";
            const isLatest = msg.id === latestMsgId;
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className={`flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-[#f5c842]/25 shadow-sm backdrop-blur-sm ${isLatest ? "msg-in" : ""}`}>
                    <span className="text-[#f5c842] text-xs" style={{ animation: "twinkle 2s ease-in-out infinite" }}>✦</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{msg.content}</span>
                    <span className="text-[#f5c842] text-xs" style={{ animation: "twinkle 2s ease-in-out 0.3s infinite" }}>✦</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2.5 ${msg.isMe ? "justify-end msg-in-me" : "justify-start msg-in"}`}>
                {!msg.isMe && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border-2 border-[#f5c842]/30 flex items-center justify-center text-xl shrink-0 mt-auto shadow-sm">
                    🧘
                  </div>
                )}
                <div className={`max-w-[78%] lg:max-w-md flex flex-col gap-1.5 ${msg.isMe ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3.5 rounded-2xl text-[14.5px] leading-relaxed font-medium transition-all ${
                    msg.isMe
                      ? "bg-gradient-to-br from-[#FF9933] to-[#f0a832] text-white rounded-br-sm"
                      : "bg-white/90 backdrop-blur-sm border border-white/60 text-slate-800 rounded-bl-sm shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
                  }`} style={msg.isMe ? { boxShadow: "0 4px 24px rgba(255,153,51,0.3)" } : {}}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 px-1">{formatTime(msg.createdAt)}</span>
                </div>
                {msg.isMe && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border-2 border-[#f5c842]/30 flex items-center justify-center text-xs font-bold text-[#FF9933] shrink-0 mt-auto shadow-sm">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start msg-in">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border-2 border-[#f5c842]/30 flex items-center justify-center text-xl shrink-0 mt-auto shadow-sm">🧘</div>
              <div className="bg-white/90 border border-white/60 backdrop-blur-sm rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full"
                    style={{ background: `linear-gradient(135deg, #f5c842, #FF9933)`, animation: `dotBounce 1s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {ended && (
            <div className="flex justify-center pt-8 pb-4 msg-in">
              <button id="back-to-dashboard-btn" onClick={() => router.push("/dashboard")}
                className="group px-8 py-3.5 rounded-2xl bg-white border border-[#FF9933]/25 text-[#FF9933] font-bold uppercase tracking-widest text-xs transition-all shadow-sm hover:bg-gradient-to-r hover:from-[#FF9933] hover:to-[#f5c842] hover:text-white hover:shadow-[0_4px_24px_rgba(255,153,51,0.35)] hover:scale-105">
                ← Return to Dashboard
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
              id="chat-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                handleTyping(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask the stars… ✦ Enter to send"
              className="flex-1 px-5 py-4 rounded-2xl text-[14.5px] font-medium resize-none overflow-hidden bg-[#faf8f5] border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/15 transition-all"
              style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="send-message-btn"
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
