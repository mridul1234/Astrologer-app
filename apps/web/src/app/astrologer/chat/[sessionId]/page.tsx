"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isMe: boolean;
}

const DUMMY_ASTRO_ID = "astro-456";
const DUMMY_USER_NAME = "Rahul M.";

export default function AstrologerChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      senderId: DUMMY_ASTRO_ID,
      content: "Namaste! 🙏 I am Pandit Ravi Sharma. I can see your aura clearly. Tell me, what guidance are you seeking from the stars today?",
      createdAt: new Date(),
      isMe: true,
    },
    {
      id: "user-reply",
      senderId: "user-123",
      content: "Namaste Panditji! I wanted to ask about my career — I'm considering a big job switch.",
      createdAt: new Date(),
      isMe: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(62); // Start at 1m 2s to show it's live
  const [connected] = useState(true);
  const [rate] = useState(30);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (ended) return;
    durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => { if (durationRef.current) clearInterval(durationRef.current); };
  }, [ended]);

  function sendMessage() {
    if (!input.trim() || ended) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: DUMMY_ASTRO_ID,
      content: input.trim(),
      createdAt: new Date(),
      isMe: true,
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  }

  function handleEndSession() {
    setEnded(true);
    if (durationRef.current) clearInterval(durationRef.current);
    const cost = (rate * duration / 60).toFixed(2);
    setMessages((prev) => [
      ...prev,
      {
        id: "ended",
        senderId: "system",
        content: `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s · Earnings: ₹${cost}`,
        createdAt: new Date(),
        isMe: false,
      },
    ]);
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  const currentEarnings = (rate * duration / 60).toFixed(2);

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
            {DUMMY_USER_NAME[0]}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{DUMMY_USER_NAME}</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                style={{ boxShadow: "0 0 4px #34d399" }}
              />
              <span className="text-green-400">{connected ? "Connected" : "Connecting…"}</span>
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
              ₹{currentEarnings}
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
          🔮 Astrologer View · {DUMMY_USER_NAME}&apos;s consultation
        </span>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
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
                  {DUMMY_USER_NAME[0]}
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
              {DUMMY_USER_NAME[0]}
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
                setInput(e.target.value);
                setIsTyping(e.target.value.length > 0);
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
