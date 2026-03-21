"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isMe: boolean;
}

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
  const [waitingTimeLeft, setWaitingTimeLeft] = useState(600); // 10 minutes max
  const [waitTimeOver, setWaitTimeOver] = useState(false);
  const [astrologerName, setAstrologerName] = useState("Astrologer");
  const [astrologerId, setAstrologerId] = useState("");
  const [rate, setRate] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const endSessionEarly = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("end_session", { sessionId });
    }
    setEnded(true);
    router.push("/dashboard");
  }, [sessionId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Duration timer (local, UI only)
  useEffect(() => {
    if (ended || !connected || !astrologerJoined) return;
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, connected, astrologerJoined]);

  // Wait timer countdown (10 mins limit)
  useEffect(() => {
    if (ended || astrologerJoined) return;
    const interval = setInterval(() => {
      setWaitingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setWaitTimeOver(true);
          // Auto-end if possible
          if (socketRef.current) {
            socketRef.current.emit("end_session", { sessionId });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ended, astrologerJoined, sessionId]);

  // ─── Load session info + connect socket ───────────────────────────────────
  useEffect(() => {
    let socket: Socket;

    async function init() {
      try {
        // 1. Get session details (astrologer name, rate, user balance)
        const sessionRes = await fetch(`/api/chat/session/${sessionId}`);
        if (!sessionRes.ok) { setStatus("error"); return; }
        const sessionData = await sessionRes.json();

        setAstrologerName(sessionData.astrologer?.user?.name || "Astrologer");
        setAstrologerId(sessionData.astrologer?.id || "");
        setRate(sessionData.astrologer?.ratePerMin || 0);

        // Check if a review already exists
        if (sessionData.review) {
          setReviewSubmitted(true);
        }
        setBalance(sessionData.user?.walletBalance || 0);
        if (sessionData.status === "ENDED") { setEnded(true); }

        // Calc initial waiting time left
        const createdMs = new Date(sessionData.createdAt).getTime();
        const elapsedSecs = Math.floor((Date.now() - createdMs) / 1000);
        const rem = Math.max(0, 600 - elapsedSecs);
        setWaitingTimeLeft(rem);
        if (rem === 0 && sessionData.status !== "ENDED") {
          setWaitTimeOver(true);
        }

        // Load existing messages - always fetch our userId for attribution
        const profileRes = await fetch("/api/user/profile");
        const profile = await profileRes.json();
        const uid = profile?.id;
        if (uid) setMyUserId(uid);

        if (sessionData.messages?.length > 0) {
          // If there are messages, we assume the astrologer had joined at some point
          setAstrologerJoined(true);
          setMessages(
            sessionData.messages.map((m: { id: string; senderId: string; content: string; createdAt: string }) => ({
              id: m.id,
              senderId: m.senderId,
              content: m.content,
              createdAt: new Date(m.createdAt),
              isMe: m.senderId === uid,
            }))
          );
        }

        // 2. Get socket token (returned by /api/chat/start as socketToken, or fetch fresh)
        const tokenRes = await fetch("/api/chat/socket-token");
        if (!tokenRes.ok) { setStatus("error"); return; }
        const { token } = await tokenRes.json();

        // 3. Connect to socket server
        // Use polling+websocket so Render free tier works (websocket-only can fail on cold start)
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket"], // Enforce websocket immediately to bypass redirect-blocker extensions
          timeout: 60000,            // Give Render.com time to wake up from sleep
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
          setStatus("ready");
          socket.emit("join_session", { sessionId });
        });

        socket.on("connect_error", (err) => {
          console.error("[Socket] connect_error:", err.message);
          setConnected(false);
          // Don't immediately set error — let reconnection attempts happen
          // Only show error state after all retries fail
        });

        socket.on("disconnect", () => setConnected(false));

        socket.on("receive_message", (msg: { id: string; senderId: string; content: string; createdAt: string }) => {
          // Get our userId from state (closure won't have it yet for first render)
          setMyUserId((uid) => {
            const isMe = msg.senderId === uid;
            setMessages((prev) => {
              // dedup by id
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

        socket.on("balance_update", ({ balance: b }: { balance: number }) => {
          setBalance(b);
        });

        socket.on("session_ended", () => {
          setEnded(true);
          if (timerRef.current) clearInterval(timerRef.current);
        });

        socket.on("astrologer_joined", () => {
          setAstrologerJoined(true);
        });

        socket.on("error", ({ message }: { message: string }) => {
          console.error("[Socket] Error:", message);
        });

      } catch (err) {
        console.error("[Chat] Init error:", err);
        setStatus("error");
      }
    }

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId]);

  // ─── Also fetch own userId separately (for message attribution) ──────────
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => { if (d?.id) setMyUserId(d.id); })
      .catch(() => {});
  }, []);

  function sendMessage() {
    if (!input.trim() || ended || !socketRef.current) return;
    const content = input.trim();
    setInput("");

    socketRef.current.emit("send_message", { sessionId, content });

    // Send typing=false
    socketRef.current.emit("typing", { sessionId, isTyping: false });
  }

  function handleTyping(text: string) {
    setInput(text);
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { sessionId, isTyping: text.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", { sessionId, isTyping: false });
      }, 1000);
    }
  }

  const submitReview = async () => {
    if (rating === 0) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/chat/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          astrologerId,
          rating,
          comment,
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
        // Optionally auto-redirect back to dashboard after a delay:
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  function handleEndSession() {
    if (!socketRef.current) return;
    socketRef.current.emit("end_session", { sessionId });
    setEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setMessages((prev) => [
      ...prev,
      {
        id: "ended-local",
        senderId: "system",
        content: `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
        createdAt: new Date(),
        isMe: false,
      },
    ]);
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  // ─── Loading / Error states ───────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-4xl animate-spin mb-4">🔮</div>
        <div className="text-purple-300/60 text-sm">Connecting to your astrologer…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
        <p className="opacity-80 mb-6">Failed to connect to chat server</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2 rounded-xl bg-[rgba(245,200,66,0.2)] text-[#f5c842] hover:bg-[#f5c842] hover:text-black transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── WAITING SCREEN ───
  if (!astrologerJoined && !ended && !waitTimeOver) {
    const mins = Math.floor(waitingTimeLeft / 60);
    const secs = waitingTimeLeft % 60;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative p-4" style={{ background: "#050311" }}>
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 30%, rgba(245,200,66,0.15) 0%, transparent 40%)" }} />
        <div className="z-10 bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-20 h-20 mb-6 rounded-full border-t-2 border-[#f5c842] border-r-2 border-r-[#f5c842]/30 animate-spin" />
          <h2 className="text-2xl font-cinzel font-bold text-[#f5c842] mb-2">Waiting for Astrologer</h2>
          <p className="text-sm opacity-80 text-white/70 mb-6">
            Connecting you to {astrologerName}...
          </p>
          <div className="text-3xl font-mono text-white/90 mb-8 bg-white/5 px-6 py-3 rounded-2xl shadow-inner border border-white/5">
            {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
          </div>
          <button
            onClick={endSessionEarly}
            className="text-red-400/80 hover:text-red-400 text-sm underline underline-offset-4"
          >
            Cancel Session
          </button>
        </div>
      </div>
    );
  }

  // ─── TIMEOUT SCREEN ───
  if (!astrologerJoined && waitTimeOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Astrologer Unavailable</h2>
        <p className="opacity-80 mb-6 max-w-sm">The astrologer did not join within 10 minutes. The session has been auto-cancelled and you have not been charged.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── ACTIVE CHAT INTERFACE ───
  return (
    <div
      className="flex flex-col h-screen"
      style={{
        background: "#faf8f5",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ─── REVIEW OVERLAY ─── */}
      {ended && astrologerJoined && !reviewSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md flex flex-col items-center shadow-2xl">
            <h2 className="text-2xl font-cinzel font-extrabold text-[#FF9933] mb-2 tracking-wide">Rate Your Session</h2>
            <p className="text-slate-500 text-sm mb-5 font-medium text-center">
              How was your consultation with {astrologerName}?
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 w-full text-sm shadow-inner">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Duration:</span>
                <span className="text-slate-800 font-bold">{Math.floor(duration / 60)}m {duration % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Cost:</span>
                <span className="text-[#10b981] font-extrabold font-cinzel text-lg">
                  ₹{(Math.max(1, Math.ceil(duration / 60)) * rate).toFixed(0)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none drop-shadow-sm"
                >
                  <span className={star <= (hoverRating || rating) ? "text-[#f5c842]" : "text-slate-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#FF9933]/50 focus:ring-2 focus:ring-[#FF9933]/20 mb-6 font-medium shadow-inner"
              rows={3}
            />

            <div className="flex w-full gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm font-bold tracking-wide shadow-sm"
              >
                Skip
              </button>
              <button
                disabled={rating === 0 || isSubmittingReview}
                onClick={submitReview}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] hover:shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-extrabold tracking-wide shadow-md"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <header
        className="flex items-center justify-between px-5 py-3.5 shrink-0 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,200,66,0.15)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-[#FF9933] transition-colors text-lg font-bold"
          >
            ←
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 bg-[#faf8f5]"
          >
            🧘
          </div>
          <div>
            <div className="text-slate-800 font-bold text-[15px] tracking-tight">{astrologerName}</div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
                style={connected ? { boxShadow: "0 0 6px #34d399" } : {}}
              />
              <span className={connected ? "text-emerald-500" : "text-red-500"}>
                {connected ? "Connected" : "Reconnecting…"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className="px-4 py-1.5 rounded-xl text-center bg-orange-50 border border-orange-100 shadow-sm"
          >
            <div className="text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-0.5">Duration</div>
            <div className="font-cinzel font-bold text-sm text-orange-600">
              {formatDuration(duration)}
            </div>
          </div>

          {/* Balance */}
          <div
            className={`px-4 py-1.5 rounded-xl text-center shadow-sm ${balance < 100 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}
          >
            <div className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 ${balance < 100 ? "text-red-400" : "text-emerald-500"}`}>Balance</div>
            <div
              className={`font-cinzel font-extrabold text-sm ${balance < 100 ? "text-red-500" : "text-emerald-600"}`}
            >
              ₹{balance.toFixed(0)}
            </div>
          </div>

          {!ended && (
            <button
              id="end-chat-btn"
              onClick={handleEndSession}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-extrabold transition-all hover:scale-105 bg-red-50 border border-red-200 text-red-500 shadow-sm ml-2"
            >
              End
            </button>
          )}
        </div>
      </header>

      {/* Rate banner */}
      <div
        className="px-5 py-2 flex items-center justify-center gap-2 shrink-0 bg-white border-b border-slate-100 shadow-sm z-10"
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF9933]">
          ₹{rate} / MIN <span className="text-slate-300 mx-2">|</span> <span className="text-slate-400">Wallet is deducted in real-time</span>
        </span>
      </div>

      {/* ─── WALLET WARNING BANNER ─── */}
      {astrologerJoined && !ended && rate > 0 && balance > 0 && balance < rate * 2 && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl flex items-center gap-4 text-sm font-bold shadow-md animate-pulse">
          <span className="text-2xl">⚠️</span> 
          <div>
            <div className="uppercase tracking-widest text-[10px] mb-0.5">Critical Warning</div>
            Less than 1 minute remaining. Top up to continue chatting!
          </div>
        </div>
      )}

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && !ended && (
          <div className="text-center py-12 flex flex-col items-center">
            <span className="text-4xl mb-3 opacity-60">🪷</span>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Session activated. Say Namaste!</span>
          </div>
        )}

        {messages.map((msg) => {
          const isSystem = msg.senderId === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div
                  className="px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold text-center max-w-sm bg-slate-100 border border-slate-200 text-slate-400 shadow-sm"
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              {!msg.isMe && (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-auto bg-white border border-slate-200 shadow-sm"
                >
                  🧘
                </div>
              )}
              <div className={`max-w-[75%] lg:max-w-md ${msg.isMe ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                <div
                  className={`px-5 py-3.5 rounded-[20px] text-[15px] leading-relaxed font-medium shadow-sm transition-all ${
                    msg.isMe
                      ? "bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white rounded-br-sm shadow-[0_4px_15px_rgba(255,153,51,0.2)]"
                      : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 px-2 mt-0.5">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-auto bg-white border border-slate-200 shadow-sm"
            >
              🧘
            </div>
            <div
              className="px-5 py-4 rounded-[20px] rounded-bl-sm flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm"
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#f5c842] animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {ended && (
          <div className="flex justify-center pt-8">
            <div className="text-center">
              <button
                id="back-to-dashboard-btn"
                onClick={() => router.push("/dashboard")}
                className="bg-white border border-[#FF9933]/30 text-[#FF9933] hover:bg-[#FF9933]/5 px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors shadow-sm"
              >
                ← Return to Dashboard
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT ─── */}
      {!ended && (
        <div
          className="px-5 py-4 shrink-0 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.02)] z-10"
        >
          <div className="flex gap-3 items-end max-w-5xl mx-auto">
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => {
                handleTyping(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask the stars... (Enter to send)"
              className="flex-1 px-5 py-4 rounded-2xl text-[15px] font-medium resize-none overflow-hidden bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#FF9933]/40 focus:bg-white transition-colors shadow-inner"
              style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="send-message-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`w-[56px] h-[56px] rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
                input.trim()
                  ? "bg-gradient-to-tr from-[#FF9933] to-[#f5c842] hover:shadow-md hover:scale-105"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              <span className={`text-xl ${input.trim() ? "text-white" : ""}`}>↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
