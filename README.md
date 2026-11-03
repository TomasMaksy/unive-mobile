# unive-mobile

A prototype of the unive mobile app (iOS and Android), built with Expo. The web app and backend live in a separate repo, `unive-v2` (checked out next to this one at `../unive-v22`).

## What it does

- **Sign in** with an emailed code, the same login as the website.
- **Today:** today's admissions action plan, including verified deadlines. Mark tasks done or skip them.
- **Chat:** the unive AI assistant (the website's global chat), with streamed replies.
- **Account:** who's signed in, and sign out.

It talks to the live unive-v2 API at `https://unive.ai`, and needs **no backend changes**.

## Run it on your phone

1. Install **Expo Go** from the App Store or Play Store.
2. In this folder:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android). The phone and computer need to be on the same Wi-Fi.

To point the app at another server, such as a Vercel preview, set `EXPO_PUBLIC_API_URL`:

```bash
EXPO_PUBLIC_API_URL=https://your-preview.vercel.app npx expo start
```

## Known limits of the prototype

- **Sign-out only happens on the device.** better-auth rejects the sign-out request without its `expo()` server plugin, so the server session lasts until it expires. Fix: add `expo()` and `trustedOrigins: ["unive://"]` in `unive-v22/src/lib/auth/server.ts`. Never trust `exp://` in production: with magic links enabled, an attacker could get a user's session sent to their own machine.
- **Chat shows text only.** Tool cards (open a page, ask for input) aren't rendered yet.
- **Only accounts with access can sign in**, the same as on the website.
