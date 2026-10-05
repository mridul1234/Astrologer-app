const assert = require("node:assert/strict");
const fs = require("node:fs");
const { phone, code } = JSON.parse(fs.readFileSync("release-private/play-review-access.json", "utf8"));
const base = "https://www.astrowalla.com";
async function request(path, body, token) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(60000),
  });
  return { status: response.status, data: await response.json() };
}
async function login(pin = code, client = "mobile") {
  const sent = await request("/api/auth/otp/send", { phone });
  assert.equal(sent.status, 200);
  assert.ok(sent.data.verificationId.startsWith("play-review:"), "Reviewer server code is not live yet");
  return request("/api/auth/otp/verify", { phone, verificationId: sent.data.verificationId, otp: pin, client });
}
async function main() {
  assert.equal((await login(code === "0000" ? "0001" : "0000")).status, 401);
  assert.equal((await login(code, "astrologer-mobile")).status, 401);
  const first = await login();
  assert.equal(first.status, 200);
  assert.equal(first.data.user.role, "USER");
  const token = first.data.accessToken;
  let profile = await request("/api/user/profile", null, token);
  assert.equal(profile.status, 200);
  assert.equal(profile.data.email, `${phone}@astrowalla.com`);
  const initialBalance = profile.data.walletBalance;
  assert.equal(profile.data.transactions.filter(tx => tx.reason === "Google Play review promotional credit").length, 1);
  if (!profile.data.kundliProfile) {
    const saved = await request("/api/user/kundli", {
      fullName: "Google Play Reviewer", dateOfBirth: "1995-06-15",
      timeOfBirth: "12:00", placeOfBirth: "New Delhi, India",
    }, token);
    assert.equal(saved.status, 200);
  }
  const second = await login();
  assert.equal(second.status, 200);
  assert.equal(second.data.user.id, first.data.user.id);
  profile = await request("/api/user/profile", null, second.data.accessToken);
  assert.equal(profile.data.walletBalance, initialBalance, "Repeat login must not grant additional credit");
  assert.ok(profile.data.kundliProfile);
  assert.equal((await request("/api/mobile/me", null, token)).status, 200);
  assert.equal((await request("/api/user/wallet", null, token)).status, 200);
  assert.equal((await request("/api/mobile/horoscope", null, token)).status, 200);
  assert.equal((await request("/api/user/profile")).status, 401);
  console.log(`PASS: production reviewer login/re-login, wrong code and astrologer client rejected, sample onboarding saved, wallet INR ${initialBalance}, horoscope accessible, normal unauthenticated profile blocked. No live consultation or card payment was initiated.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
