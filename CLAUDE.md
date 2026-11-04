# unive-mobile

Mobile app for unive (iOS + Android). Planned stack: Expo + Expo Router + TypeScript.

# The web repo: ../unive-v22

The web app and backend (`unive-v2` on GitHub, Next.js + Drizzle + better-auth, bun) is checked out at `../unive-v22`. Use it as the source of truth for the product, API routes (`src/app/api`), data models (`drizzle/`, `src/lib`), and auth (`src/lib/auth`).

- Treat `../unive-v22` as **read-only**. Don't edit, commit, or run scripts there unless the user explicitly asks for a backend change.
- Backend changes the mobile app needs (e.g. token-based auth, new endpoints) go on the `feat/mobile-app` branch in `unive-v22`, never on `main`, and only after the user agrees. That branch collects all of them, so it can later be merged into `main` or dropped as a whole.
- Never read or copy secrets from `../unive-v22/.env.local` into this repo.
- Follow `../unive-v22/CLAUDE.md` when working inside that repo.

# Working here

- Plan before building anything non-trivial, especially auth.
- Build feature by feature (login → deadlines → AI feedback → flashcards); commit after each one works.
