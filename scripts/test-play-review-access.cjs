const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const settings = new Map();
const users = new Map();
const transactions = [];
const db = {
  systemSetting: {
    async upsert({ where, create }) {
      if (!settings.has(where.key)) settings.set(where.key, { ...create });
      return { ...settings.get(where.key) };
    },
    async findUniqueOrThrow({ where }) { return { ...settings.get(where.key) }; },
    async updateMany({ where, data }) {
      const row = settings.get(where.key);
      if (row?.value !== where.value) return { count: 0 };
      settings.set(where.key, { ...row, ...data });
      return { count: 1 };
    },
  },
  user: {
    async upsert({ where, create }) {
      if (!users.has(where.email)) users.set(where.email, { id: "review-user", walletBalance: 0, ...create });
      return { ...users.get(where.email) };
    },
    async update({ where, data }) {
      const row = [...users.values()].find(user => user.id === where.id);
      row.walletBalance += data.walletBalance.increment;
      row.introOfferUsed = data.introOfferUsed;
      row.freeMinutesLeft = data.freeMinutesLeft;
      return { ...row };
    },
    async findUniqueOrThrow({ where }) { return { ...[...users.values()].find(user => user.id === where.id) }; },
  },
  transaction: { async create({ data }) { transactions.push(data); return data; } },
  async $transaction(callback) { return callback(db); },
};
const source = fs.readFileSync("apps/web/src/lib/play-review-access.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(compiled, {
  exports: moduleObject.exports, module: moduleObject, process, Buffer,
  require: name => name === "@astrology/db" ? { prisma: db } : require(name),
});
const api = moduleObject.exports;
async function main() {
  process.env.MOBILE_AUTH_SECRET = "test-secret-only-not-production";
  delete process.env.PLAY_REVIEW_PHONE;
  delete process.env.PLAY_REVIEW_CODE;
  assert.equal(api.isPlayReviewPhone("0000000001"), false);
  process.env.PLAY_REVIEW_PHONE = "0000000001";
  process.env.PLAY_REVIEW_CODE = "5826";
  assert.equal(api.isPlayReviewPhone("9876543210"), false);
  assert.equal(api.isPlayReviewPhone("0000000001"), true);
  const challenge = api.createPlayReviewChallenge("0000000001");
  const verify = (code, client = "mobile", token = challenge, phone = "0000000001") => api.verifyPlayReviewChallenge(phone, token, code, client);
  assert.equal(await verify("5826", "astrologer-mobile"), false);
  assert.equal(await verify("5826", undefined, challenge, "9876543210"), false);
  assert.equal(await verify("5826", "mobile", challenge + "tampered"), false);
  assert.equal(await verify("0000"), false);
  assert.equal(await verify("5826"), true);
  const expired = "play-review:" + require("jsonwebtoken").sign({ phone: "0000000001", purpose: "play-review-login" }, process.env.MOBILE_AUTH_SECRET, { expiresIn: -1 });
  assert.equal(await verify("5826", "mobile", expired), false);
  assert.equal((await api.getPlayReviewUser("0000000001")).walletBalance, 1000);
  assert.equal((await api.getPlayReviewUser("0000000001")).introOfferUsed, true);
  assert.equal((await api.getPlayReviewUser("0000000001")).freeMinutesLeft, 3);
  assert.equal((await api.getPlayReviewUser("0000000001")).walletBalance, 1000);
  assert.equal(transactions.length, 1);
  users.clear();
  assert.equal((await api.getPlayReviewUser("0000000001")).walletBalance, 0, "Account deletion must not reset the grant");
  settings.clear();
  const attempts = await Promise.all(Array.from({ length: 15 }, () => verify("0000")));
  assert.equal(attempts.some(Boolean), false);
  assert.ok(Number(settings.get("play-review-attempts:0000000001").value.split(":")[1]) <= 10);
  for (let index = 0; index < 10; index++) await verify("0000");
  assert.equal(await verify("5826"), false, "New challenges must not reset the shared budget");
  assert.equal(await verify("5826", "mobile", api.createPlayReviewChallenge("0000000001")), false);
  settings.set("play-review-attempts:0000000001", { value: "0:10" });
  assert.equal(await verify("5826"), true, "Budget resets after the hour changes");
  users.set("0000000001@astrowalla.com", { id: "admin", role: "ADMIN" });
  await assert.rejects(api.getPlayReviewUser("0000000001"));
  console.log("PASS: disabled config, account isolation, wrong/tampered/expired codes, role restriction, reusable login, shared concurrent budget, one-time credit, deletion does not regrant credit.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
