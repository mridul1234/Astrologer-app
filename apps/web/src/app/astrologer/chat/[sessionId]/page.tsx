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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (ended || !connected) return;
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const next = d + 1;
        const minutesBilled = Math.ceil(next / 60);
        setEarnings(minutesBilled * rate);
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, connected, rate]);

  useEffect(() => {
    let socket: Socket;
    async function init() {
      try {
        const sessionRes = await fetch(`/api/chat/session/${sessionId}`);
        if (!sessionRes.ok) { setStatus("error"); return; }
        const sessionData = await sessionRes.json();

        setUserName(sessionData.user?.name || "User");
        setRate(sessionData.astrologer?.ratePerMin || 0);
        if (sessionData.status === "ENDED") setEnded(true);
        setEarnings(sessionData.totalCost || 0);

        const profileRes = await fetch("/api/astrologer/profile");
        const profile = await profileRes.json();
        const uid = profile?.userId || profile?.id;
        if (uid) setMyUserId(uid);

        if (sessionData.messages?.length > 0) {
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

        socket.on("session_ended", () => { setEnded(true); if (timerRef.current) clearInterval(timerRef.current); });
        socket.on("error", ({ message }: { message: string }) => console.error("[Socket] Error:", message));

      } catch (err) {
        console.error("[AstrologerChat] Init error:", err);
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
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit("typing", { sessionId, isTyping: false }); }, 2000);
    }
  }

  function handleEndSession() {
    if (!socketRef.current) return;
    socketRef.current.emit("end_session", { sessionId });
    setEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setMessages((prev) => [...prev, {
      id: "ended-local", senderId: "system",
      content: `Session ended · ${Math.floor(duration / 60)}m ${duration % 60}s · ${Math.ceil(duration / 60)} min billed · Earned ₹${Math.ceil(duration / 60) * rate}`,
      createdAt: new Date(), isMe: false,
    }]);
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDuration = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#faf8f5]">
        <VedicLoader size="lg" text="Loading session…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-[#faf8f5]">
        <div className="text-5xl">🪐</div>
        <div className="text-slate-600 text-sm font-medium">Could not connect to chat server.</div>
        <button onClick={() => router.push("/astrologer")} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
          ← Back to Portal
        </button>
      </div>
    );
  }

  const userInitial = (userName[0] || "U").toUpperCase();

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="shrink-0 z-20" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(245,200,66,0.2)", boxShadow: "0 2px 16px rgba(245,200,66,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: back + user info */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/astrologer")} className="w-9 h-9 rounded-xl bg-[#faf8f5] border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF9933] hover:border-[#FF9933]/30 transition-all text-lg">
              ←
            </button>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-200/50 flex items-center justify-center text-lg font-extrabold text-purple-500 shadow-sm">
                {userInitial}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${connected ? "bg-emerald-400" : "bg-red-400"}`} style={connected ? { boxShadow: "0 0 6px #34d399" } : {}} />
            </div>
            <div>
              <div className="text-slate-800 font-bold text-[15px] tracking-tight">{userName}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-purple-400">✦ Seeker</div>
            </div>
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-amber-400">Time</div>
              <div className="font-cinzel font-bold text-xs text-amber-600">{formatDuration(duration)}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <div className="text-[8px] uppercase tracking-widest font-bold text-emerald-500">Earned</div>
              <div className="font-cinzel font-extrabold text-xs text-emerald-600">₹{earnings.toFixed(0)}</div>
              <div className="text-[7px] text-emerald-400 font-semibold">{Math.ceil(duration / 60)} min</div>
            </div>
            <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-[#faf8f5] border border-[#f5c842]/30 text-center">
              <div>
                <div className="text-[8px] uppercase tracking-widest font-bold text-[#FF9933]">Rate</div>
                <div className="font-cinzel font-bold text-xs text-slate-700">₹{rate}/min</div>
              </div>
            </div>
            {!ended && (
              <button id="end-session-btn" onClick={handleEndSession}
                className="px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-extrabold bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all">
                End
              </button>
            )}
          </div>
        </div>

        {/* Zodiac strip */}
        <div className="px-4 py-1.5 border-t border-[#f5c842]/10 flex items-center justify-between overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400">🔮 Astrologer View</span>
          <div className="flex gap-3">
            {ZODIAC.slice(0, 8).map((z, i) => (
              <span key={i} className="text-[10px] text-[#f5c842]/40 font-bold">{z}</span>
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Guiding {userName}</span>
        </div>
      </header>

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
                🌟
              </div>
              <p className="font-cinzel font-bold text-slate-700 text-sm mb-1">Session started</p>
              <p className="text-slate-400 text-xs">Await the seeker's first message ✨</p>
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
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 flex items-center justify-center text-sm font-extrabold text-purple-500 shrink-0 mt-auto shadow-sm">
                    {userInitial}
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
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9933]/15 to-[#f5c842]/15 border border-[#f5c842]/25 flex items-center justify-center text-lg shrink-0 mt-auto shadow-sm">
                    🔮
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 flex items-center justify-center text-sm font-extrabold text-purple-500 shrink-0 mt-auto shadow-sm">
                {userInitial}
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
              <button id="back-to-astrologer-btn" onClick={() => router.push("/astrologer")}
                className="px-8 py-3.5 rounded-2xl bg-white border border-[#FF9933]/25 text-[#FF9933] hover:bg-gradient-to-r hover:from-[#FF9933] hover:to-[#f5c842] hover:text-white hover:border-transparent font-bold uppercase tracking-widest text-xs transition-all shadow-sm hover:shadow-md">
                ← Back to Portal
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
            <div className="flex-1">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Share your cosmic insight… (Enter to send)"
                className="w-full px-5 py-4 rounded-2xl text-[14.5px] font-medium resize-none overflow-hidden bg-[#faf8f5] border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#f5c842]/50 focus:ring-2 focus:ring-[#f5c842]/15 transition-all"
                style={{ minHeight: "56px", maxHeight: "120px", lineHeight: "1.5" }}
              />
            </div>
            <button
              id="astro-send-btn"
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
