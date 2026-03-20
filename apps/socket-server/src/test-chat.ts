import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const SOCKET_URL = "http://localhost:3001";
const SOCKET_SECRET = process.env.SOCKET_SECRET || "supersecret_for_socket_auth";

async function runTest() {
  console.log("Starting chat test...");

  // 1. Create or get test users
  let testUser = await prisma.user.findFirst({ where: { email: "testuser@example.com" } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
        role: "USER",
        walletBalance: 100,
      },
    });
  } else {
    await prisma.user.update({ where: { id: testUser.id }, data: { walletBalance: 100 } });
  }

  let testAstrologerUser = await prisma.user.findFirst({ where: { email: "astro@example.com" } });
  if (!testAstrologerUser) {
    testAstrologerUser = await prisma.user.create({
      data: {
        name: "Test Astrologer",
        email: "astro@example.com",
        password: "password123",
        role: "ASTROLOGER",
      },
    });
  }

  let astrologer = await prisma.astrologer.findFirst({ where: { userId: testAstrologerUser.id } });
  if (!astrologer) {
    astrologer = await prisma.astrologer.create({
      data: {
        userId: testAstrologerUser.id,
        ratePerMin: 15,
        isOnline: true,
      },
    });
  }

  // 2. Create a chat session
  const session = await prisma.chatSession.create({
    data: {
      userId: testUser.id,
      astrologerId: astrologer.id,
      status: "ACTIVE",
    },
  });

  console.log(`Created chat session: ${session.id}`);

  // 3. Generate tokens
  const userToken = jwt.sign({ userId: testUser.id }, SOCKET_SECRET, { expiresIn: "1h" });
  const astroToken = jwt.sign({ userId: testAstrologerUser.id }, SOCKET_SECRET, { expiresIn: "1h" });

  // 4. Connect sockets
  const userSocket = io(SOCKET_URL, { auth: { token: userToken } });
  const astroSocket = io(SOCKET_URL, { auth: { token: astroToken } });

  userSocket.on("connect", () => {
    console.log("User socket connected");
    userSocket.emit("join_session", { sessionId: session.id });
  });

  astroSocket.on("connect", () => {
    console.log("Astrologer socket connected");
    astroSocket.emit("join_session", { sessionId: session.id });
  });

  // Test communication
  let messagesReceived = 0;

  userSocket.on("receive_message", (msg) => {
    console.log("[User Client] Received message:", msg.content);
    if (msg.content === "Hello from Astrologer!") {
      messagesReceived++;
      checkDone();
    }
  });

  astroSocket.on("receive_message", (msg) => {
    console.log("[Astro Client] Received message:", msg.content);
    if (msg.content === "Hello from User!") {
      messagesReceived++;
      // Reply
      setTimeout(() => {
         astroSocket.emit("send_message", { sessionId: session.id, content: "Hello from Astrologer!" });
      }, 500);
    }
  });

  userSocket.on("session_joined", () => {
    console.log("User joined, sending first message...");
    setTimeout(() => {
      userSocket.emit("send_message", { sessionId: session.id, content: "Hello from User!" });
    }, 1000);
  });

  userSocket.on("balance_update", ({ balance }) => {
    console.log(`[User Client] Balance updated. New balance: ₹${balance}`);
  });

  async function checkDone() {
    if (messagesReceived === 2) {
      console.log("Test passed! Both messages delivered successfully.");
      userSocket.emit("end_session", { sessionId: session.id });
      setTimeout(() => {
        userSocket.disconnect();
        astroSocket.disconnect();
        process.exit(0);
      }, 1000);
    }
  }

  // Timeout for test
  setTimeout(() => {
    console.error("Test timed out!");
    process.exit(1);
  }, 10000);
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
