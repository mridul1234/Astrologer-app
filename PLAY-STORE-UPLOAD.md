# AstroWalla: First Google Play Upload

Prepared on 4 October 2026 for the user app, package `com.astrowalla.app`.
This is an Android release. It does not publish an iOS app to Apple's App Store.

## Files

- Upload `release-output/AstroWalla-1.0.0-1.aab` to Google Play. Do not upload the debug APK.
- Install `release-output/AstroWalla-1.0.0-1.apk` for direct release testing.
- Store icon: `release-output/store-assets/play-icon-512.png`.
- Feature graphic: `release-output/store-assets/feature-graphic-1024x500.png`.
- Take current, real screenshots on your phone: Home, astrologer list, profile and wallet. Do not upload old screenshots that show removed features.
- Back up the entire `release-private` folder privately. It contains the upload key and passwords. Never put this folder in Git or send it to testers.

## 1. Use Your Existing Account

Your screenshots show access to Play Console and no account policy issues.
Google's developer registration charge is a one-time USD 25 fee; you do not pay again to add an app to an active account.
Check account verification tasks and unread notifications. Previously registered packages are separate from AstroWalla.

## 2. Upload Today to Internal Testing

1. Open https://play.google.com/console and sign in to your existing developer account.
2. On Home, click Create app.
3. Name: AstroWalla. Default language: English (India), or English if that variant is unavailable. Select App and Free. Free means free to download; consultations can still be paid.
4. Read and accept the declarations yourself, then Create app.
5. Open Test and release > Testing > Internal testing.
6. Select Create new release. If prompted, use Google Play App Signing with Google generating the app signing key. Our local key is the upload key.
7. Upload `release-output/AstroWalla-1.0.0-1.aab`. The package should be `com.astrowalla.app`, version 1.0.0, version code 1, target API 36.
8. Release name: 1.0.0 Internal Test. Release notes: "Initial AstroWalla Android release for internal testing."
9. Resolve any errors Play Console reports; do not ignore signing, native compatibility, or policy errors.
10. Save, review and roll out to internal testing.
11. On the Testers tab, create an email list containing your Google account and your testers' Google accounts. Save it.
12. Copy the opt-in link. Open it on a phone signed into a listed Google account, join the test, then install from Google Play.

If the phone already has our debug APK, the Play version may refuse to replace it because the signing keys differ. Uninstall the debug app only after confirming you can log in again. Server-side account data is separate from the installation.

## 3. Store Listing

Open Grow users > Store presence > Main store listing (menu wording may vary).

- App name: AstroWalla
- Short description: "Connect with astrologers, explore daily horoscopes and manage consultations."
- Full description:

  AstroWalla connects you with astrologers for personal chat consultations.
  Browse astrologer profiles, view their availability and consultation rates, and choose whom to chat with.
  Explore daily horoscopes, add your birth details, and manage your consultation history and wallet.
  Consultations are paid services. Availability and prices vary by astrologer.
  Astrology content is for personal reflection and entertainment; it is not medical, legal or financial advice.

- Support email: help.astrowalla@gmail.com (confirm you monitor this inbox).
- Website: https://www.astrowalla.com
- Suggested category: Lifestyle.
- Upload the prepared icon and feature graphic plus at least two real phone screenshots; four useful screenshots are preferable.

## 4. App Content and Review Access

Complete the Dashboard's setup tasks and Policy > App content:

- Privacy policy: https://www.astrowalla.com/privacy-policy . Deploy and verify the corrected policy first.
- Account deletion URL: https://www.astrowalla.com/delete-account . Deploy and verify the new public page first; monitor deletion emails and verify ownership before deleting accounts.
- Ads: choose No only if the released app contains no advertisements.
- App access: login restricts functionality. Give Google a dedicated reviewer account and repeatable instructions. OTP-only access must work without Google contacting you for each OTP. Do not enter your personal login or claim unrestricted access.
- Content rating: complete IARC accurately for user-to-astrologer text and image communication.
- Target audience: select adults if that is your intended audience; do not select children for convenience.
- Data safety: disclose actual collection and sharing. Source review identifies phone/account identifiers, name, date/time/place of birth, chat text and images, wallet/payment history, reviews and notification identifiers when push is configured. Payment details are processed by Razorpay. Review the payment/SMS/storage providers' SDK disclosures too. Do not claim no data collection.
- Complete any financial features, health, advertising ID or other declarations shown by your console based on the actual app. Wallet consultation credits are not an investment product; do not mark unrelated features as present.

## 5. Resolve Production Blockers

- Render chat service is suspended and must be restored. Verify `/health` returns 200 and a real two-party chat works before review.
- Push requires an Expo/EAS project ID, Android Firebase configuration and FCM v1 credentials in Expo. None are confirmed configured. Installing expo-notifications alone does not make delivery work. Complete setup and rebuild if notifications are part of the launch.
- Billing needs a decision before production: Google exempts some paid one-to-one services from Play Billing only when the service cannot be replayed. This app exposes past chat transcripts, so that exemption cannot be assumed. Preserve history and implement compliant Play Billing/eligible alternative billing, or assess a live-only consultation implementation with no replay. Do not simply claim Razorpay is exempt.
- Complete a real-device check of OTP, onboarding, profile editing, ₹1 pass, recharge success/cancel, live chat, image sharing, reconnect, session cancel/end and account deletion. No phone was connected during release preparation. Do not delete a real customer's account to test deletion.
- Photo sharing uses Android's image picker without full-library or camera access. Test selecting an image on both a current Android phone and any older Android version you support.
- Verify production API changes are deployed; mobile release builds use https://www.astrowalla.com and https://astrologer-socket-server.onrender.com.

## 6. Production Submission

1. Check whether Test and release > Production is available. An older account may already have access. New personal accounts created after 13 November 2023 require 12 opted-in closed testers for 14 continuous days before applying for production access. Account age is not established by our screenshots.
2. Complete all required setup tasks, reviewer access and policy decisions first.
3. Review Play's pre-launch report from the testing build. Fix crashes and compatibility issues before submitting publicly.
4. Promote the tested release to Production (or create a production release and reuse the existing bundle through the artifact library).
5. Choose countries where the service and billing are supported. Initially choose India if that is the intended market.
6. Review the release and send changes for review from Publishing overview. Google decides approval timing; uploading today does not guarantee going live today.

## Future Builds

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-user-release.ps1 -VersionCode 2
```

Keep using the same upload key. Increment VersionCode for each new uploaded bundle; Google cannot accept a new artifact with an already used code.

## Official References

- Create an app: https://support.google.com/googleplay/android-developer/answer/9859152
- Internal testing: https://support.google.com/googleplay/android-developer/answer/9845334
- New personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- API 36 requirement: https://support.google.com/googleplay/android-developer/answer/11926878
- Payments and one-to-one services: https://support.google.com/googleplay/android-developer/answer/10281818
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Expo Android push setup: https://docs.expo.dev/push-notifications/push-notifications-setup/
