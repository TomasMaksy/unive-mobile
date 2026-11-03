# unive-mobile

A prototype of the unive mobile app (iOS and Android), built with Expo. The web app and backend live in a separate repo, `unive-v2` (checked out next to this one at `../unive-v22`).

## What it does

- **Sign in** with an emailed code, the same login as the website.
- **Today:** today's admissions action plan, including verified deadlines. Mark tasks done or skip them.
- **Chat:** the unive AI assistant (the website's global chat), with streamed replies.
- **Account:** who's signed in, and sign out.

It has no backend of its own: it calls the unive-v2 API, and needs **no backend changes**.

## Which backend?

The app holds no secrets (anyone can unpack a phone app), so it doesn't use unive-v2's `.env.local`. Its only setting is `EXPO_PUBLIC_API_URL`, the backend it talks to. It's built into the app when Metro bundles it, like `NEXT_PUBLIC_` in Next.js. Without it, the app uses production.

| Command | Backend | Sign-in code |
| --- | --- | --- |
| `npm run dev` | your laptop, `http://localhost:3000` | printed as `[OTP]` in the same terminal |
| `npm run prod` | `https://unive.ai`, real users and data | real email |

In development the sign-in screen says which backend it's using.

## Develop against your laptop (start here)

```bash
npm install
npm run dev
```

[`scripts/dev.sh`](scripts/dev.sh) does three things:

1. Starts unive-v2 with its own `bun dev` in `../unive-v22` (docker + Next.js on port 3000). If it's already running, it uses that instead.
2. Waits until the backend answers.
3. Opens the iOS Simulator with Expo Go and loads the app from Metro on your Mac.

Sign in with the email of an account in your local database and the `[OTP]` code printed in the same terminal. `@unive.ai` emails always have access. Ctrl+C stops the app and the backend it started.

`localhost` works only in the iOS Simulator, which runs on your Mac. On a real phone, `localhost` is the phone itself.

Press `r` in the Metro terminal to reload the app, and `i` to reopen the simulator.

## Run it on your phone (production backend)

1. Install **Expo Go** from the App Store or Play Store.
2. Run `npm run prod` and scan the QR code with your phone's camera (iOS) or the Expo Go app (Android). The phone and computer need to be on the same Wi-Fi.

To use another server, such as a Vercel preview, set the URL yourself:

```bash
EXPO_PUBLIC_API_URL=https://your-preview.vercel.app npx expo start --clear
```

`--clear` matters: Metro caches the bundle, and without it the app may keep the old URL.

## Known limits of the prototype

- **Sign-out only happens on the device.** better-auth rejects the sign-out request without its `expo()` server plugin, so the server session lasts until it expires. Fix: add `expo()` and `trustedOrigins: ["unive://"]` in `unive-v22/src/lib/auth/server.ts`. Never trust `exp://` in production: with magic links enabled, an attacker could get a user's session sent to their own machine.
- **Chat shows text only.** Tool cards (open a page, ask for input) aren't rendered yet.
- **Only accounts with access can sign in**, the same as on the website.
