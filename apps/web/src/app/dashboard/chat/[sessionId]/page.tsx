"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | Date;
}

interface SessionData {
  id: string;
  userId: string;
  astrologer: {
    id: string;
    ratePerMin: number;
    user: { name: string };
  };
  user: { name: string; walletBalance: number };
  messages: Message[];
  status: string;
}

export default function UserChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: authSession } = useSession();
  const router = useRouter();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load session data + connect socket
  useEffect(() => {
    if (!authSession?.user) return;

    // Get socket token from localStorage (set when starting chat)
    const socketToken = localStorage.getItem(`socket_token_${sessionId}`);
    if (!socketToken) {
      router.push("/dashboard");
      return;
    }

    // Fetch session history
    fetch(`/api/chat/session/${sessionId}`)
      .then((r) => r.json())
      .then((data: SessionData) => {
        setSessionData(data);
        setMessages(data.messages || []);
        setBalance(data.user.walletBalance ?? 0);
      });

    // Connect to socket server
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      auth: { token: socketToken },
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_session", { sessionId });
    });

    socket.on("session_joined", () => {
      console.log("Joined session room");
    });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("balance_update", ({ balance: newBalance }: { balance: number }) => {
      setBalance(newBalance);
    });

    socket.on("user_typing", ({ isTyping: t }: { isTyping: boolean }) => {
      setIsTyping(t);
    });

    socket.on("session_ended", () => {
      setEnded(true);
    });

    socket.on("disconnect", () => setConnected(false));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [authSession, sessionId, router]);

  function sendMessage() {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { sessionId, content: input.trim() });
    setInput("");
  }

  function handleTyping() {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { sessionId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { sessionId, isTyping: false });
    }, 1500);
  }

  function endSession() {
    socketRef.current?.emit("end_session", { sessionId });
  }

  const astrologerName = sessionData?.astrologer?.user?.name ?? "Astrologer";
  const myId = authSession?.user?.id ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-lg">
            🔮
          </div>
          <div>
            <div className="text-white font-semibold">{astrologerName}</div>
            <div className="text-xs text-purple-300">
              {connected ? "● Connected" : "○ Connecting..."}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-purple-300">Wallet</div>
            <div className={`font-bold text-sm ${balance < 20 ? "text-red-400" : "text-green-400"}`}>
              ₹{balance.toFixed(2)}
            </div>
          </div>
          {!ended && (
            <button
              onClick={endSession}
              className="px-4 py-2 text-sm rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-medium transition"
            >
              End Chat
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm shadow-lg ${
                  isMine
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm"
                    : "bg-white/10 border border-white/10 text-white rounded-bl-sm backdrop-blur"
                }`}
              >
                {msg.content}
                <div className={`text-xs mt-1 ${isMine ? "text-purple-200" : "text-white/40"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white/10 text-white/60 text-sm border border-white/10">
              {astrologerName} is typing...
            </div>
          </div>
        )}

        {ended && (
          <div className="text-center py-6">
            <div className="inline-block px-6 py-3 rounded-2xl bg-white/10 text-purple-300 text-sm border border-white/10">
              Session ended
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!ended && (
        <div className="px-4 py-4 border-t border-white/10 bg-black/20 backdrop-blur">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask the stars..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-purple-500 hover:to-indigo-500 transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
