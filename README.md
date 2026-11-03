# unive-mobile

A prototype of the unive mobile app (iOS and Android), built with Expo. The web app and backend live in a separate repo, `unive-v2` (checked out next to this one at `../unive-v22`).

## What it does

- **Sign in** with an emailed code, the same login as the website.
- **Chat:** the unive AI assistant (the website's global chat), with streamed replies. Chats are saved by the backend like the website's, so they show up in the website's chat history for the same account and backend.
- **Account:** who's signed in, and sign out.

A **Today** screen (the admissions action plan from `/api/admissions/action-plan`) is built but hidden, because the website doesn't show the action plan yet. Its code is in [src/features/today](src/features/today). While it was visible, opening it generated a plan for the account if none existed.

It has no backend of its own: it calls the unive-v2 API, and needs **no backend changes**.

## Which backend?

The app holds no secrets (anyone can unpack a phone app), so it doesn't use unive-v2's `.env.local`. Its only setting is `EXPO_PUBLIC_API_URL`, the backend it talks to. It's built into the app when Metro bundles it, like `NEXT_PUBLIC_` in Next.js. Without it, the app uses production.

| Command | Backend | Sign-in code |
| --- | --- | --- |
| `npm run dev` | your Mac, at its Wi-Fi address (e.g. `http://192.168.1.247:3000`) | printed as `[OTP]` in the same terminal |
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
3. Opens the iOS Simulator with Expo Go, loads the app from Metro on your Mac, and prints a QR code for your phone.

The app talks to your Mac at its Wi-Fi address, not `localhost`: on a phone, `localhost` is the phone itself. That address works from the simulator and from any phone on the same Wi-Fi.

**On your iPhone:** install **Expo Go** from the App Store, be on the same Wi-Fi as your Mac, and scan the QR code in the terminal with the Camera app. If Expo Go asks to find devices on your local network, allow it.

Sign in with the email of an account in your local database and the `[OTP]` code printed in the same terminal. `@unive.ai` emails always have access. Ctrl+C stops the app and the backend it started.

Press `r` in the Metro terminal to reload the app, and `i` to reopen the simulator.

## Against production

`npm run prod` points the app at `https://unive.ai`: real users, real data in Neon, real emails. Scan the QR code the same way.

To use another server, such as a Vercel preview, set the URL yourself:

```bash
EXPO_PUBLIC_API_URL=https://your-preview.vercel.app npx expo start --clear
```

`--clear` matters: Metro caches the bundle, and without it the app may keep the old URL.

## Known limits of the prototype

- **Sign-out only happens on the device.** better-auth rejects the sign-out request without its `expo()` server plugin, so the server session lasts until it expires. Fix: add `expo()` and `trustedOrigins: ["unive://"]` in `unive-v22/src/lib/auth/server.ts`. Never trust `exp://` in production: with magic links enabled, an attacker could get a user's session sent to their own machine.
- **Chat shows text only.** Tool cards (open a page, ask for input) aren't rendered yet.
- **Only accounts with access can sign in**, the same as on the website.
- **The app icon is still Expo's placeholder.** It needs a square 1024×1024 source with no transparency (the website's `unive-app-icon.png` has a shadow baked in). Expo Go shows its own icon anyway, so this matters only for a real build.

## Brand

Colors, fonts and radii live in [src/constants/theme.ts](src/constants/theme.ts), copied from the website (`unive-v22/src/app/globals.css` and the `/login` page). Headings use Averia Serif Libre and everything else uses Inter, loaded before the first screen renders. Like the website, the app is light-only for now.
