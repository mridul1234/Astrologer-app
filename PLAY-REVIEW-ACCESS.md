# Google Play Reviewer Access

The USER app uses the normal phone/OTP screens with one dedicated, non-routable
review identifier. Its reusable PIN is configured only on the production server
in `PLAY_REVIEW_PHONE` and `PLAY_REVIEW_CODE`. Neither credential is in source or
the Android bundle. See the private `release-private/play-review-access.json`.

## Access

- Enter the ten-digit review identifier after the app's fixed +91 prefix.
- Tap Continue, then enter the reusable four-digit PIN. No SMS is sent.
- Complete onboarding if the review profile was deleted.
- All normal USER APIs, astrologer availability, billing and chat are unchanged.
- Initial access receives a complimentary three-minute intro pass and a one-time
  INR 1,000 promotional wallet credit with a
  transaction entry. It is not automatically replenished, including after account
  deletion. Monitor the review balance and use normal admin credit tools if needed.
- Paid consultations still generate normal astrologer earnings. This is not a
  simulated payment or a special hidden review version of the app.
- This does not let Google charge a real Razorpay transaction without a payment
  method. Credit permits paid chat access, but reviewer instructions must explain
  wallet checkout separately and must not promise an unverified payment sandbox.

## Security and Operations

- Missing or malformed server configuration disables this login route.
- Only identifiers starting with 000 are allowed; never use a real person's phone.
- Review verification can issue only USER mobile tokens, not website, ADMIN or
  ASTROLOGER access. The stored role is checked before a token is returned.
- Challenges expire after ten minutes; start again with Continue when needed.
- Ten verification attempts per clock hour are allowed across all challenges and
  server instances. Changing phone/challenge does not reset this shared budget.
- Credentials themselves remain reusable until intentionally rotated. Keep them
  current in Play Console for future reviews; do not disable access after approval.
- Rotate the PIN in Vercel and redeploy if leaked. Do not commit private credentials.
- Before declaring full access, verify the Play-installed build and arrange real
  astrologer availability. This setup does not fix the separate billing-policy issue.

## Checks

`node scripts/test-play-review-access.cjs` tests configuration isolation, signatures,
expiration, wrong codes, shared concurrent attempt limits, role boundaries and
one-time credit semantics with an in-memory database double.

`node scripts/verify-play-review-live.cjs` checks deployed login, saved profile,
wallet and horoscope access. It never starts a consultation or charges a card.
