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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Duration timer
  useEffect(() => {
    if (ended || !connected) return;
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const next = d + 1;
        // Update earnings display locally (rate is per minute)
        setEarnings((next / 60) * rate);
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, connected, rate]);

  // ─── Load session info + connect socket ───────────────────────────────────
  useEffect(() => {
    let socket: Socket;

    async function init() {
      try {
        // 1. Fetch session data
        const sessionRes = await fetch(`/api/chat/session/${sessionId}`);
        if (!sessionRes.ok) { setStatus("error"); return; }
        const sessionData = await sessionRes.json();

        setUserName(sessionData.user?.name || "User");
        setRate(sessionData.astrologer?.ratePerMin || 0);
        if (sessionData.status === "ENDED") { setEnded(true); }
        setEarnings(sessionData.totalCost || 0);

        // 2. Get our own userId
        // Ensure we handle it even if we're not an active astrologer yet (e.g., admin doing testing)
        const profileRes = await fetch("/api/astrologer/profile");
        const profile = await profileRes.json();
        const uid = profile?.userId || profile?.id;
        if (uid) setMyUserId(uid);

        // Load existing messages
        if (sessionData.messages?.length > 0) {
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

        // 3. Get socket token
        const tokenRes = await fetch("/api/chat/socket-token");
        if (!tokenRes.ok) { setStatus("error"); return; }
        const { token } = await tokenRes.json();

        // 4. Connect
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
        });

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

        socket.on("session_ended", () => {
          setEnded(true);
          if (timerRef.current) clearInterval(timerRef.current);
        });

        socket.on("error", ({ message }: { message: string }) => {
          console.error("[Socket] Error:", message);
        });

      } catch (err) {
        console.error("[AstrologerChat] Init error:", err);
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

  function sendMessage() {
    if (!input.trim() || ended || !socketRef.current) return;
    const content = input.trim();
    setInput("");

    const tempMsg: Message = {
      id: `tmp_${Date.now()}`,
      senderId: myUserId || "astro",
      content,
      createdAt: new Date(),
      isMe: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    socketRef.current.emit("send_message", { sessionId, content });
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
      }, 2000);
    }
  }

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
        content: `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s · Earnings: ₹${earnings.toFixed(2)}`,
        createdAt: new Date(),
        isMe: false,
      },
    ]);
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-4xl animate-spin mb-4">🔮</div>
        <div className="text-purple-300/60 text-sm">Loading session…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-4xl">⚠️</div>
        <div className="text-red-400 text-sm">Could not connect to chat server.</div>
        <button onClick={() => router.push("/astrologer")} className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{ position: "relative", zIndex: 1 }}
    >
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
            onClick={() => router.push("/astrologer")}
            className="text-purple-400/60 hover:text-white transition-colors text-lg"
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(124,58,237,0.2))",
              border: "1px solid rgba(52,211,153,0.2)",
              color: "#6ee7b7",
            }}
          >
            {userName[0]}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{userName}</div>
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

          {/* Earnings */}
          <div
            className="px-3 py-1.5 rounded-lg text-center"
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.15)",
            }}
          >
            <div className="text-xs text-purple-300/50">Earned</div>
            <div className="font-cinzel font-bold text-sm text-green-400">
              ₹{earnings.toFixed(0)}
            </div>
          </div>

          {/* Rate badge */}
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(245,200,66,0.06)",
              border: "1px solid rgba(245,200,66,0.12)",
              color: "rgba(253,230,138,0.7)",
            }}
          >
            ₹{rate}/min
          </div>

          {!ended && (
            <button
              id="end-session-btn"
              onClick={handleEndSession}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Astrologer role banner */}
      <div
        className="px-5 py-2 flex items-center justify-center gap-2 shrink-0"
        style={{
          background: "rgba(245,200,66,0.04)",
          borderBottom: "1px solid rgba(245,200,66,0.07)",
        }}
      >
        <span className="text-xs text-purple-300/40">
          🔮 Astrologer View · {userName}&apos;s consultation
        </span>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && !ended && (
          <div className="text-center text-purple-400/40 text-sm py-10">
            🌟 Session started — your client will message you shortly
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
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-auto"
                  style={{
                    background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(124,58,237,0.2))",
                    border: "1px solid rgba(52,211,153,0.2)",
                    color: "#6ee7b7",
                  }}
                >
                  {userName[0]}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${msg.isMe ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.isMe
                      ? {
                          background: "linear-gradient(135deg, #d97706, #f5c842)",
                          color: "#1a0533",
                          borderBottomRightRadius: "4px",
                          boxShadow: "0 4px 20px rgba(217,119,6,0.25)",
                          fontWeight: 500,
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
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(124,58,237,0.2))",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#6ee7b7",
              }}
            >
              {userName[0]}
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
            <button
              id="back-to-astrologer-btn"
              onClick={() => router.push("/astrologer")}
              className="btn-gold px-8 py-3 rounded-2xl font-bold"
            >
              ← Back to Dashboard
            </button>
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
              id="astro-chat-input"
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
              placeholder="Share your cosmic insight… (Enter to send)"
              className="cosmic-input flex-1 px-4 py-3.5 rounded-2xl text-sm resize-none overflow-hidden"
              style={{ minHeight: "50px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="astro-send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #d97706, #f5c842)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: input.trim() ? "0 4px 20px rgba(217,119,6,0.3)" : "none",
              }}
            >
              <span className="text-base" style={{ color: input.trim() ? "#1a0533" : "white" }}>↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
