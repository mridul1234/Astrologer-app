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
        // Billing: ceil(minutes) × rate — each started minute is fully charged
        const minutesBilled = Math.ceil(next / 60);
        setEarnings(minutesBilled * rate);
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
        content: `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s · Billed: ${Math.ceil(duration / 60)} min · Earnings: ₹${Math.ceil(duration / 60) * rate}`,
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
      <div className="flex flex-col h-screen items-center justify-center bg-[#faf8f5]" style={{ position: "relative", zIndex: 1 }}>
        <VedicLoader size="lg" text="Loading session…" />
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
      style={{
        background: "#faf8f5",
        fontFamily: "'Inter', sans-serif"
      }}
    >
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
            onClick={() => router.push("/astrologer")}
            className="text-slate-400 hover:text-[#FF9933] transition-colors text-lg font-bold"
          >
            ←
          </button>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner bg-slate-50 border border-slate-200 text-slate-500"
          >
            {userName[0]}
          </div>
          <div>
            <div className="text-slate-800 font-extrabold text-[15px] tracking-tight">{userName}</div>
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

          {/* Earnings */}
          <div
            className="px-4 py-1.5 rounded-xl text-center shadow-sm bg-emerald-50 border border-emerald-100"
          >
            <div className="text-[9px] uppercase tracking-widest font-bold mb-0.5 text-emerald-500">Earned</div>
            <div className="font-cinzel font-extrabold text-sm text-emerald-600">
              ₹{earnings.toFixed(0)}
            </div>
            <div className="text-[8px] text-emerald-400 font-semibold">{Math.ceil(duration / 60)} min billed</div>
          </div>

          {/* Rate badge */}
          <div
            className="hidden sm:block px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest bg-white border border-[#FF9933]/30 text-[#FF9933] shadow-sm ml-2"
          >
            ₹{rate} / MIN
          </div>

          {!ended && (
            <button
              id="end-session-btn"
              onClick={handleEndSession}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-extrabold transition-all hover:scale-105 bg-red-50 border border-red-200 text-red-500 shadow-sm ml-2"
            >
              End
            </button>
          )}
        </div>
      </header>

      {/* Astrologer role banner */}
      <div
        className="px-5 py-2 flex items-center justify-center gap-2 shrink-0 bg-white border-b border-slate-100 shadow-sm z-10"
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <span className="text-[#FF9933]">🔮 Astrologer View</span> <span className="text-slate-300 mx-2">|</span> Guiding {userName}
        </span>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && !ended && (
          <div className="text-center py-12 flex flex-col items-center">
            <span className="text-4xl mb-3 opacity-60 drop-shadow-sm">🌟</span>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Session started. Await client's message.</span>
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 mt-auto bg-slate-50 border border-slate-200 shadow-sm text-slate-500"
                >
                  {userName[0]}
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
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 mt-auto bg-slate-50 border border-slate-200 shadow-sm text-slate-500"
            >
              {userName[0]}
            </div>
            <div
              className="px-5 py-4 rounded-[20px] rounded-bl-sm flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm"
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {ended && (
          <div className="flex justify-center pt-8">
            <button
              id="back-to-astrologer-btn"
              onClick={() => router.push("/astrologer")}
              className="bg-white border border-[#FF9933]/30 text-[#FF9933] hover:bg-[#FF9933]/5 px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors shadow-sm"
            >
              ← Back to Portal
            </button>
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
              placeholder="Share your cosmic insight... (Enter to send)"
              className="flex-1 px-5 py-4 rounded-2xl text-[15px] font-medium resize-none overflow-hidden bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#FF9933]/40 focus:bg-white transition-colors shadow-inner"
              style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
            />
            <button
              id="astro-send-btn"
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
