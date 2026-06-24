# AstroWalla Android App

Native Android client for AstroWalla, built with Expo and React Native. It uses the existing Next.js API, PostgreSQL database, Socket.IO server, Razorpay orders, and Message Central OTP service.

## What is included

- Secure bearer-token OTP session for native clients.
- Astrologer discovery and native `Rs 1` intro-chat pass.
- Razorpay wallet top-ups.
- Chat history and realtime Socket.IO chat.
- Simplified mobile-first chat UI.
- Android package configuration and EAS App Bundle profile.

## Required backend environment

Set these on the deployed web API:

```env
MOBILE_AUTH_SECRET=generate-a-long-random-secret
SOCKET_SECRET=existing-socket-secret
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Set these in `apps/mobile/.env` for local development:

```env
EXPO_PUBLIC_API_URL=https://your-deployed-web-domain.com
EXPO_PUBLIC_SOCKET_URL=https://your-deployed-socket-domain.com
```

For an Android emulator, local URLs use `http://10.0.2.2:<port>`. For a physical phone, use a public HTTPS deployment or a secure tunnel; `localhost` on the phone is not your computer.

## Run locally

```powershell
npm.cmd install
Copy-Item apps/mobile/.env.example apps/mobile/.env
# Fill in deployed API and socket URLs.
npm.cmd run android --workspace=apps/mobile
```

Open the app in an Android emulator or an Expo development build. Test this sequence:

1. Send and verify an OTP with a new phone number.
2. Confirm the user starts with no automatic minutes.
3. Tap Chat with an online astrologer and complete the `Rs 1` pass in Razorpay test mode.
4. Confirm three intro minutes appear and the chat request connects.
5. Send messages both ways, check typing, end the chat, then top up wallet and continue.
6. Confirm an account that already used the intro pass is routed to normal wallet top-up.

## Validate before a release

```powershell
npm.cmd run typecheck --workspace=apps/mobile
npm.cmd run export:android --workspace=apps/mobile
npx.cmd prisma generate --schema=packages/db/prisma/schema.prisma
npx.cmd tsc --noEmit -p apps/web/tsconfig.json
```

## Build the Google Play App Bundle

1. Create an Expo account and install/log in to EAS CLI:

```powershell
npm.cmd install --global eas-cli
eas login
cd apps/mobile
eas init
```

2. `eas init` replaces `REPLACE_WITH_EAS_PROJECT_ID` in `app.json`.
3. Create an Android keystore when EAS prompts. Store recovery access securely.
4. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` as EAS environment variables; never put payment keys or server secrets in the app.
5. Build a production `.aab`:

```powershell
eas build --platform android --profile production
```

6. Download the completed App Bundle or submit it with:

```powershell
eas submit --platform android --profile production
```

## Google Play Console release checklist

1. Register a Google Play Developer account and create the `AstroWalla` application.
2. Use the package name `com.astrowalla.app` before the first production upload. It cannot be changed afterward.
3. Upload the `.aab` to Internal Testing first and invite the team.
4. Complete Data safety, App content, Content rating, Ads declaration, Privacy policy, Support email, and target audience forms.
5. Add store listing assets: 512x512 icon, 1024x500 feature graphic, at least four phone screenshots, short description, full description, and support URL.
6. Verify Razorpay, OTP, Socket.IO, deep links, wallet verification, and account deletion/support flow on a real device.
7. Review current Google Play payment policy for astrology consultations and wallet credits before submitting. Get legal/compliance confirmation for your exact service classification.
8. Run Closed Testing, collect crashes and payment logs, fix issues, then create a Production rollout. Start at 10 percent, monitor, then expand.

## Not automated by source code

Publishing requires your Google Play developer account, Play Console declarations, legal/privacy copy, real production credentials, a production API/socket deployment, and a manual policy review. Those actions cannot be completed from this workspace alone.
