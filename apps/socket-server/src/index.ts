import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "@astrology/db";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// @ts-ignore - Prisma is already initialized in @astrology/db

// ─── Async Message Write Queue ───────────────────────────────────────────────
// Messages are buffered here and flushed to DB every 2s — never blocks WS path
interface QueuedMessage {
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}
const messageQueue: QueuedMessage[] = [];

setInterval(async () => {
  if (messageQueue.length === 0) return;
  const batch = messageQueue.splice(0);
  try {
    await prisma.message.createMany({ data: batch });
  } catch (err) {
    console.error("[DB] Failed to persist messages:", err);
    // Put back in queue
    messageQueue.unshift(...batch);
  }
}, 2000);

// ─── Per-session billing state ────────────────────────────────────────────────
interface SessionMeta {
  userId: string;
  astrologerId: string;
  ratePerMin: number;
}
const billingTimers = new Map<string, NodeJS.Timeout>();
const activeSessions = new Map<string, SessionMeta>();

// ─── Socket.io Auth Middleware ────────────────────────────────────────────────
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.SOCKET_SECRET!) as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ─── Socket Event Handlers ────────────────────────────────────────────────────
io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  console.log(`[Socket] Connected: ${userId}`);

  // User/astrologer joins a chat room
  socket.on("join_session", async ({ sessionId }: { sessionId: string }) => {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { astrologer: { select: { userId: true, ratePerMin: true } } },
      });

      if (!session) return socket.emit("error", { message: "Session not found" });

      const isParticipant =
        session.userId === userId || session.astrologer.userId === userId;
      if (!isParticipant) return socket.emit("error", { message: "Unauthorized" });

      socket.join(sessionId);
      socket.emit("session_joined", { sessionId });

      const isAstrologer = session.astrologer.userId === userId;
      
      const socketsInRoom = await io.in(sessionId).fetchSockets();
      const astrologerInRoom = socketsInRoom.some(s => s.data.userId === session.astrologer.userId);
      const userInRoom = socketsInRoom.some(s => s.data.userId === session.userId);

      if (isAstrologer) {
        io.to(sessionId).emit("astrologer_joined");
      }
      
      // If user is joining and astrologer is already there, tell the user immediately
      if (session.userId === userId && astrologerInRoom) {
        socket.emit("astrologer_joined");
      }

      // Start billing timer only when BOTH are in the room
      if (astrologerInRoom && userInRoom && !billingTimers.has(sessionId)) {
        const meta = {
          userId: session.userId,
          astrologerId: session.astrologerId,
          astrologerUserId: session.astrologer.userId,
          ratePerMin: session.astrologer.ratePerMin,
        };
        activeSessions.set(sessionId, meta);

        // Function to charge 1 minute
        const chargeMinute = async () => {
          try {
            const currentMeta = activeSessions.get(sessionId);
            if (!currentMeta) return;

            const updated = await prisma.user.update({
              where: { id: currentMeta.userId },
              data: { walletBalance: { decrement: currentMeta.ratePerMin } },
            });

            await prisma.user.update({
              where: { id: currentMeta.astrologerUserId },
              data: { walletBalance: { increment: currentMeta.ratePerMin } },
            });

            await prisma.$transaction([
              prisma.chatSession.update({
                where: { id: sessionId },
                data: { totalCost: { increment: currentMeta.ratePerMin } },
              }),
              prisma.transaction.create({
                data: {
                  userId: currentMeta.userId,
                  amount: currentMeta.ratePerMin,
                  type: "DEBIT",
                  reason: `Chat - session ${sessionId}`,
                },
              }),
              prisma.transaction.create({
                data: {
                  userId: currentMeta.astrologerUserId,
                  amount: currentMeta.ratePerMin,
                  type: "CREDIT",
                  reason: `Chat Earnings - session ${sessionId}`,
                },
              }),
            ]);

            io.to(sessionId).emit("balance_update", {
              balance: updated.walletBalance,
            });

            if (updated.walletBalance <= 0) {
              await endSession(sessionId, "insufficient_balance");
            }
          } catch (err) {
            console.error("[Billing] Error:", err);
          }
        };

        // Charge the FIRST minute immediately (minimum charge)
        await chargeMinute();

        // Then continue charging every 60 seconds
        const timer = setInterval(chargeMinute, 60_000);
        billingTimers.set(sessionId, timer);
      }
    } catch (err) {
      console.error("[join_session] Error:", err);
    }
  });

  // Send a message
  socket.on(
    "send_message",
    ({ sessionId, content }: { sessionId: string; content: string }) => {
      if (!content?.trim()) return;
      const message: QueuedMessage = {
        sessionId,
        senderId: userId,
        content: content.trim(),
        createdAt: new Date(),
      };
      messageQueue.push(message);
      // Broadcast immediately — no DB wait
      io.to(sessionId).emit("receive_message", {
        ...message,
        id: `tmp_${Date.now()}`,
      });
    }
  );

  // Typing indicator
  socket.on(
    "typing",
    ({ sessionId, isTyping }: { sessionId: string; isTyping: boolean }) => {
      socket.to(sessionId).emit("user_typing", { userId, isTyping });
    }
  );

  // Explicit session end
  socket.on("end_session", async ({ sessionId }: { sessionId: string }) => {
    await endSession(sessionId, "user_ended");
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${userId}`);
  });
});

// ─── End Session Helper ───────────────────────────────────────────────────────
async function endSession(sessionId: string, reason: string) {
  const timer = billingTimers.get(sessionId);
  if (timer) {
    clearInterval(timer);
    billingTimers.delete(sessionId);
  }
  activeSessions.delete(sessionId);

  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: "ENDED", endedAt: new Date() },
    });
  } catch (err) {
    console.error("[endSession] DB error:", err);
  }

  io.to(sessionId).emit("session_ended", { sessionId, reason });
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = parseInt(process.env.PORT || "3001");
httpServer.listen(PORT, () => {
  console.log(`[Socket.io] Server running on http://localhost:${PORT}`);
});
