const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const { spawn, spawnSync } = require("node:child_process");
require("@next/env").loadEnvConfig(path.resolve("apps/web"));
const schema = `qa_chat_safety_${Date.now()}`;
assert.match(schema, /^qa_chat_safety_\d+$/);
const database = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
database.searchParams.set("schema", schema);
process.env.DATABASE_URL = database.toString();
process.env.DIRECT_URL = database.toString();
process.env.NEXT_PUBLIC_SOCKET_URL = "http://localhost:3106";
process.env.NODE_ENV = "test";
delete process.env.PLAY_REVIEW_PHONE;
delete process.env.PLAY_REVIEW_CODE;
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { io } = require("socket.io-client");
const prisma = new PrismaClient();
const children = [];
const clients = [];
let logs = "";
let schemaCreated = false;
const base = "http://localhost:3105";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(route, token, method = "GET", data) {
  const response = await fetch(base + route, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(60000),
  });
  let body; try { body = await response.json(); } catch { body = {}; }
  return { status: response.status, body };
}
function child(file, args, cwd, env) {
  const processChild = spawn(process.execPath, [file, ...args], { cwd, env: { ...process.env, ...env }, windowsHide: true });
  children.push(processChild);
  processChild.stdout.on("data", value => { logs = (logs + value).slice(-8000); });
  processChild.stderr.on("data", value => { logs = (logs + value).slice(-8000); });
  return processChild;
}
async function waitReady(url) {
  for (let index = 0; index < 60; index++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).status < 500) return; } catch {}
    await delay(1000);
  }
  throw new Error(`Test server did not start: ${url}`);
}
const socketToken = user => jwt.sign({ userId: user.id }, process.env.SOCKET_SECRET, { expiresIn: "10m" });
const mobileToken = user => jwt.sign({ userId: user.id, role: user.role, audience: "mobile" }, process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET, { expiresIn: "10m" });
function event(socket, name, action) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off(name, handler); reject(new Error(`Missing event ${name}`)); }, 15000);
    const handler = value => { clearTimeout(timeout); resolve(value); };
    socket.once(name, handler); action?.();
  });
}
async function connect(user) {
  const socket = io("http://localhost:3106", { auth: { token: socketToken(user) }, transports: ["websocket"], autoConnect: false });
  clients.push(socket); await event(socket, "connect", () => socket.connect()); return socket;
}
async function main() {
  const setup = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate", "--schema", "packages/db/prisma/schema.prisma"], { env: process.env, encoding: "utf8", windowsHide: true });
  assert.equal(setup.status, 0, setup.stderr);
  schemaCreated = true;
  const seeker = await prisma.user.create({ data: { name: "QA seeker", email: "qa-seeker@example.invalid", password: "test-only", introOfferUsed: true, walletBalance: 100 } });
  const astrologer = await prisma.user.create({ data: { name: "QA provider", email: "qa-provider@example.invalid", password: "test-only", role: "ASTROLOGER", astrologerProfile: { create: { ratePerMin: 1 } } }, include: { astrologerProfile: true } });
  const outsider = await prisma.user.create({ data: { name: "QA outsider", email: "qa-outsider@example.invalid", password: "test-only" } });
  child(path.resolve("apps/socket-server/dist/index.js"), [], process.cwd(), { PORT: "3106" });
  child(path.resolve("node_modules/next/dist/bin/next"), ["dev", "--port", "3105"], path.resolve("apps/web"), { NODE_ENV: "development" });
  await waitReady("http://localhost:3106/health");
  await waitReady(base + "/api/user/blocks");
  const token = mobileToken(seeker);
  const otherToken = mobileToken(outsider);
  assert.equal((await request("/api/user/blocks")).status, 401);
  assert.equal((await request("/api/admin/reports", token)).status, 403);
  const started = await request("/api/chat/start", token, "POST", { astrologerId: astrologer.astrologerProfile.id });
  assert.equal(started.status, 200);
  const session = await prisma.chatSession.findFirstOrThrow({ where: { userId: seeker.id } });
  assert.equal((await request("/api/user/blocks", otherToken, "POST", { sessionId: session.id })).status, 403);
  assert.equal((await request("/api/user/reports", otherToken, "POST", { sessionId: session.id, reason: "Other", details: "QA" })).status, 403);
  const first = await connect(seeker), provider = await connect(astrologer), stranger = await connect(outsider);
  await event(first, "session_joined", () => first.emit("join_session", { sessionId: session.id }));
  assert.equal((await event(stranger, "error", () => stranger.emit("send_message", { sessionId: session.id, content: "Unauthorized" }))).message, "Unauthorized");
  await event(stranger, "error", () => stranger.emit("end_session", { sessionId: session.id }));
  assert.equal((await prisma.chatSession.findUniqueOrThrow({ where: { id: session.id } })).status, "ACTIVE");
  await event(first, "balance_update", () => provider.emit("join_session", { sessionId: session.id }));
  const message = await event(first, "receive_message", () => provider.emit("send_message", { sessionId: session.id, content: "QA message to report" }));
  assert.ok(!message.id.startsWith("tmp_"));
  assert.equal((await request("/api/user/reports", token, "POST", { sessionId: session.id, messageId: message.id, reason: "Other", details: "Isolated QA report" })).status, 201);
  assert.equal((await request("/api/user/reports", token, "POST", { sessionId: session.id, messageId: "wrong-message", reason: "Other", details: "QA" })).status, 400);
  await event(first, "session_ended", async () => {
    assert.equal((await request("/api/user/blocks", token, "POST", { sessionId: session.id })).status, 200);
  });
  const before = await prisma.user.findUniqueOrThrow({ where: { id: seeker.id } });
  const cost = (await prisma.chatSession.findUniqueOrThrow({ where: { id: session.id } })).totalCost;
  await delay(2500);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: seeker.id } })).walletBalance, before.walletBalance);
  assert.equal((await prisma.chatSession.findUniqueOrThrow({ where: { id: session.id } })).totalCost, cost);
  const messagesBefore = await prisma.message.count();
  await event(provider, "error", () => provider.emit("send_message", { sessionId: session.id, content: "Blocked message" }));
  assert.equal(await prisma.message.count(), messagesBefore);
  await event(provider, "session_ended", () => provider.emit("join_session", { sessionId: session.id }));
  assert.equal((await request("/api/chat/start", token, "POST", { astrologerId: astrologer.astrologerProfile.id })).status, 403);
  assert.equal((await request("/api/user/blocks", token)).body.length, 1);
  await request("/api/user/blocks", otherToken, "DELETE", { blockedId: astrologer.id });
  assert.equal(await prisma.userBlock.count(), 1, "Another account cannot unblock this user's block");
  await request("/api/user/blocks", token, "DELETE", { blockedId: astrologer.id });
  assert.equal(await prisma.userBlock.count(), 0);
  assert.equal((await prisma.chatSession.findUniqueOrThrow({ where: { id: session.id } })).status, "ENDED");
  assert.equal((await request("/api/chat/start", token, "POST", { astrologerId: astrologer.astrologerProfile.id })).status, 200);
  await request("/api/user/blocks", mobileToken(astrologer), "POST", { sessionId: session.id });
  assert.equal((await request("/api/chat/start", token, "POST", { astrologerId: astrologer.astrologerProfile.id })).status, 403, "Reverse-direction block must be enforced");
  // Exercise real moderation handlers with only the auth session stubbed.
  let adminIdentity = { id: outsider.id, role: "USER" };
  const ts = require("typescript");
  const compiled = ts.transpileModule(fs.readFileSync("apps/web/src/app/api/admin/reports/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { exports: mod.exports, module: mod, Date, process, require: name => name === "@astrology/db" ? { prisma } : name === "@/auth" ? { auth: async () => ({ user: adminIdentity }) } : name === "@/lib/chat-safety" ? { notifySafetyEnd: async () => {} } : require(name) });
  assert.equal((await mod.exports.GET()).status, 403);
  adminIdentity = { id: outsider.id, role: "ADMIN" };
  assert.equal((await mod.exports.GET()).status, 200);
  const report = await prisma.contentReport.findFirstOrThrow();
  const review = data => mod.exports.PATCH({ json: async () => data });
  assert.equal((await review({ id: report.id, status: "RESOLVED", adminNote: "" })).status, 400);
  assert.equal((await review({ id: report.id, status: "RESOLVED", adminNote: "QA removal", action: "REMOVE_MESSAGE" })).status, 200);
  assert.equal((await prisma.message.findUniqueOrThrow({ where: { id: message.id } })).content, "[Message removed by support]");
  assert.equal((await prisma.contentReport.findUniqueOrThrow({ where: { id: report.id } })).content, "QA message to report");
  console.log("PASS: isolated API/socket QA: participant authorization, persistent message reports, block/unblock ownership, both block directions, no messages/rejoin/restart or billing after blocking, admin authorization, required review notes, removal with evidence retained. Production data was not used.");
}
main().catch(error => { console.error(error.stack); console.error(logs); process.exitCode = 1; }).finally(async () => {
  clients.forEach(socket => socket.disconnect());
  for (const processChild of children) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(processChild.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    else processChild.kill();
  }
  if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  await prisma.$disconnect();
});
