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

    // Optimistically add our own message
    const tempMsg: Message = {
      id: `tmp_${Date.now()}`,
      senderId: myUserId || "me",
      content,
      createdAt: new Date(),
      isMe: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

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
        background: "linear-gradient(to bottom, #0a0815, #05030a)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ─── REVIEW OVERLAY ─── */}
      {ended && astrologerJoined && !reviewSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#110e20] border border-[#f5c842]/20 p-8 rounded-3xl w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-cinzel font-bold text-[#f5c842] mb-2">Rate Your Session</h2>
            <p className="text-white/70 text-sm mb-6 text-center">
              How was your consultation with {astrologerName}?
            </p>
            
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={star <= (hoverRating || rating) ? "text-[#f5c842]" : "text-white/20"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#f5c842]/50 mb-6"
              rows={3}
            />

            <div className="flex w-full gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors text-sm font-semibold"
              >
                Skip
              </button>
              <button
                disabled={rating === 0 || isSubmittingReview}
                onClick={submitReview}
                className="flex-1 py-3 px-4 rounded-xl bg-[#f5c842] hover:bg-[#ffe175] text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <header
        className="flex items-center justify-between px-5 py-3.5 shrink-0"
        style={{
          background: "rgba(5,3,17,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-400/60 hover:text-white transition-colors text-lg"
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(217,119,6,0.3))",
              border: "1px solid rgba(245,200,66,0.15)",
            }}
          >
            🔮
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{astrologerName}</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
                style={connected ? { boxShadow: "0 0 4px #34d399" } : {}}
              />
              <span className={connected ? "text-green-400" : "text-red-400"}>
                {connected ? "Connected" : "Reconnecting…"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className="px-3 py-1.5 rounded-lg text-center"
            style={{
              background: "rgba(245,200,66,0.08)",
              border: "1px solid rgba(245,200,66,0.15)",
            }}
          >
            <div className="text-xs text-purple-300/50">Duration</div>
            <div className="font-cinzel font-bold text-sm" style={{ color: "#f5c842" }}>
              {formatDuration(duration)}
            </div>
          </div>

          {/* Balance */}
          <div
            className="px-3 py-1.5 rounded-lg text-center"
            style={{
              background: balance < 100 ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)",
              border: `1px solid ${balance < 100 ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.15)"}`,
            }}
          >
            <div className="text-xs text-purple-300/50">Balance</div>
            <div
              className="font-cinzel font-bold text-sm"
              style={{ color: balance < 100 ? "#f87171" : "#34d399" }}
            >
              ₹{balance.toFixed(0)}
            </div>
          </div>

          {!ended && (
            <button
              id="end-chat-btn"
              onClick={handleEndSession}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              End Chat
            </button>
          )}
        </div>
      </header>

      {/* Rate banner */}
      <div
        className="px-5 py-2 flex items-center justify-center gap-2 shrink-0"
        style={{
          background: "rgba(245,200,66,0.05)",
          borderBottom: "1px solid rgba(245,200,66,0.08)",
        }}
      >
        <span className="text-xs text-purple-300/50">
          ₹{rate}/min · Wallet is being deducted in real-time
        </span>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && !ended && (
          <div className="text-center text-purple-400/40 text-sm py-10">
            🌟 Session started — say Namaste!
          </div>
        )}

        {messages.map((msg) => {
          const isSystem = msg.senderId === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div
                  className="px-5 py-2.5 rounded-2xl text-xs text-center max-w-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(196,181,253,0.6)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              {!msg.isMe && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-auto"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.2))",
                    border: "1px solid rgba(245,200,66,0.1)",
                  }}
                >
                  🔮
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md ${msg.isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.isMe
                      ? {
                          background: "linear-gradient(135deg, #7c3aed, #d97706)",
                          color: "white",
                          borderBottomRightRadius: "4px",
                          boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(233,213,255,0.9)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  {msg.content}
                </div>
                <span className="text-xs text-purple-500/40 px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,119,6,0.2))",
                border: "1px solid rgba(245,200,66,0.1)",
              }}
            >
              🔮
            </div>
            <div
              className="px-4 py-3.5 rounded-2xl flex items-center gap-1"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {ended && (
          <div className="flex justify-center pt-4">
            <div className="text-center">
              <button
                id="back-to-dashboard-btn"
                onClick={() => router.push("/dashboard")}
                className="btn-gold px-8 py-3 rounded-2xl font-bold"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT ─── */}
      {!ended && (
        <div
          className="px-4 py-4 shrink-0"
          style={{
            background: "rgba(5,3,17,0.9)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
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
              placeholder="Ask the stars… (Enter to send)"
              className="cosmic-input flex-1 px-4 py-3.5 rounded-2xl text-sm resize-none overflow-hidden"
              style={{ minHeight: "50px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="send-message-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #7c3aed, #d97706)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: input.trim() ? "0 4px 20px rgba(124,58,237,0.3)" : "none",
              }}
            >
              <span className="text-white text-lg">↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
