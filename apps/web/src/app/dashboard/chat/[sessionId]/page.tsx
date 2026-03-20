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

const DUMMY_ME_ID = "user-123";
const DUMMY_ASTROLOGER_NAME = "Pandit Ravi Sharma";
const DUMMY_RATE = 30;

// Dummy bot replies to simulate astrologer
const BOT_REPLIES = [
  "The stars suggest a period of transformation ahead. Be open to new opportunities. 🌟",
  "I see Jupiter in your 10th house — this is a very favorable time for career matters.",
  "Your moon sign indicates deep emotional sensitivity. Trust your intuition.",
  "The planetary alignment this week favors decisive action. Take that bold step!",
  "I sense some turbulence in relationships, but Venus moving into your 7th house soon will bring harmony.",
  "This is an auspicious time for new beginnings. The universe is aligned with your intentions.",
  "Your birth chart shows you are entering a powerful Mahadasha period. Great things are coming.",
];

export default function UserChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      senderId: "astrologer",
      content: "Namaste! 🙏 I am Pandit Ravi Sharma. I can see your aura clearly. Tell me, what guidance are you seeking from the stars today?",
      createdAt: new Date(),
      isMe: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(500);
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(0); // seconds in session
  const [connected] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const billingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Billing timer
  useEffect(() => {
    if (ended) return;
    billingRef.current = setInterval(() => {
      setDuration((d) => d + 1);
      // Deduct per second (rate/60 per second)
      setBalance((b) => {
        const deduction = DUMMY_RATE / 60;
        const newBalance = b - deduction;
        if (newBalance <= 0) {
          setEnded(true);
          return 0;
        }
        return newBalance;
      });
    }, 1000);
    return () => { if (billingRef.current) clearInterval(billingRef.current); };
  }, [ended]);

  function sendMessage() {
    if (!input.trim() || ended) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: DUMMY_ME_ID,
      content: input.trim(),
      createdAt: new Date(),
      isMe: true,
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");

    // Simulate astrologer typing and replying
    setIsTyping(true);
    const delay = 1500 + Math.random() * 1500;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: "astrologer",
        content: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
        createdAt: new Date(),
        isMe: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, delay);
  }

  function handleEndSession() {
    setEnded(true);
    if (billingRef.current) clearInterval(billingRef.current);
    setMessages((prev) => [
      ...prev,
      {
        id: "ended",
        senderId: "system",
        content: `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s · Total cost: ₹${(DUMMY_RATE * duration / 60).toFixed(2)}`,
        createdAt: new Date(),
        isMe: false,
      },
    ]);
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

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
            <div className="text-white font-semibold text-sm">{DUMMY_ASTROLOGER_NAME}</div>
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
          ₹{DUMMY_RATE}/min · Wallet is being deducted in real-time
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
                setInput(e.target.value);
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
