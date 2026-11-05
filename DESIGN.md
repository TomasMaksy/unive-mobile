# Design system

How the app looks, and how we keep it that way with several people (and AI agents) building screens.

**The brand book is the source of truth:** [`unive-brand`](https://github.com/TomasMaksy/unive-branding), checked out at `../unive-brand`. Its `src/app/globals.css` holds every colour, shadow and motion value; its `src/components/ui/` shows how each component should look and behave. This app copies those values into typed tokens and builds the same components natively. When the brand changes, it changes there first.

## Why not Tailwind

On the web every developer could write any class (`text-[#5a5a5a] mt-[13px]`), so four people produced four styles. Here, a screen can only use what the system offers, and the tools enforce it:

- **TypeScript** only accepts names that exist: `colors.accent` works, `colors.olive` is a type error.
- **ESLint** (`npm run lint`) fails on a hex colour, `rgba()`, `fontSize`, `fontFamily`, `ActivityIndicator`, or raw `Text`/`expo-haptics` import anywhere outside the system.
- **`npm run brand:check`** compares our palette with the brand repo and lists any drift.

## The three layers

```
src/theme/            values (tokens)   → import { colors, space, type } from '@/theme'
src/components/ui/    looks (primitives) → import { Button, Card, Text } from '@/components/ui'
src/app, src/features screens            → build from the two above, nothing else
```

| What | Where | Example |
| --- | --- | --- |
| A hex code | `src/theme/palette.ts`, nowhere else | `meadow: '#6f7644'` |
| What a colour is for | `src/theme/colors.ts` | `colors.accent`, `colors.textMuted` |
| Font, size, tracking | `src/theme/typography.ts` | `<Text variant="title">` |
| Spacing, corners, shadows | `src/theme/layout.ts` | `space[4]`, `shape.card`, `shadow.card` |
| Timing, curves, entrances | `src/theme/motion.ts` | `duration.quick`, `easeUnive`, `riseIn(1)` |
| Haptics | `src/theme/haptics.ts` | `haptics.success()` |
| A reusable look with states | `src/components/ui/` | `Button`, `Field`, `Card` |
| One screen's layout | the screen's own `StyleSheet` | using tokens only |

## Tokens

**Colours.** Use roles, not paint: `colors.text` (ink), `colors.textSecondary` (graphite, body copy), `colors.textMuted` (pebble, captions), `colors.background` (paper), `colors.backgroundGrouped` (mist, pages of cards), `colors.surface` (white, cards), `colors.fill` (mist, quiet fills), `colors.accent` (meadow), and the states `success` / `warning` / `danger` with their `…Soft` fills and `…Text` inks. For a tint use `alpha('meadow', 0.12)`; for a fade-out gradient use `fade('paper')`.
Brand proportions per screen: paper ~70%, ink ~18%, mist ~8%, meadow ~4%. **Meadow is the only accent. There is no blue.**

**Type.** Averia Serif Libre is the voice (headings, leads, numbers that matter); Inter does the work (buttons, labels, body). Always through `<Text variant>`:

| Variant | Font | Use |
| --- | --- | --- |
| `display` | Averia 300 · 44 | hero moments only (sign-in, big empty states) |
| `h1` | Averia 400 · 40 | rare, heavy moments |
| `h2` | Averia 300 · 34 | page titles (`<PageTitle>`) |
| `h3` | Averia 300 · 28 | big section headings |
| `title` | Averia 300 · 24 | card, section and sheet titles |
| `lead` | Averia 300 · 18 | the intro line under a heading |
| `headline` | Inter 500 · 17 | row titles, compact-card titles |
| `body` | Inter 400 · 16 | body copy |
| `callout` | Inter 400 · 15 | dense body: list rows, chat |
| `small` | Inter 400 · 14 | secondary copy |
| `label` | Inter 500 · 14 | form labels, chips, small actions |
| `caption` | Inter 400 · 12 | meta, timestamps, hints |
| `eyebrow` | Inter 500 · 11 caps | a label above a heading |
| `count` | Inter 600 · 12 | tiny counts |

Averia is always tracked in by 3% (`serifTracking(size)`; in SwiftUI `kerning(size * -0.03)`). Same names as the website's `type-*` utilities.

**Spacing** is a 4-point grid named like Tailwind: `space[1]` = 4, `space[2]` = 8, `space[4]` = 16, `space[6]` = 24. Screen side padding is `screenPadding` (20).

**Corners** are iOS's continuous squircle: spread `shape.pill` (buttons, inputs, chips), `shape.tile` (thumbnails), `shape.bubble`, `shape.card` (24), `shape.panel` (32).

**Shadows** are warm and soft: `shadow.card` for cards on paper, `shadow.raised` for floating bars, `shadow.frame` for artwork.

## Components

| Component | Use it for |
| --- | --- |
| `Text` | All text. `variant`, `color` (a role), `align`. |
| `Button` | Every tappable action that has a label. Variants `primary` (ink, one per screen), `secondary` (mist), `outline` (on cards), `inverse` (on photos), `ghost`, `accent` (meadow, growth moments), `generating` (with `loadingLabel`), `destructive`. Sizes `sm` / `md` / `lg`. `loading`, `disabled`, `icon`, `inline`. |
| `Field` | Text input: `label`, `hint`, `error`, `disabled`, `size`. |
| `Card` / `CardGroup` | White squircle with the warm shadow; `onPress` makes it tappable (tap opens the full page). `tone="flat"` inside a `CardGroup` tray. |
| `Badge` | Status: `neutral`, `success`, `warning`, `error`. |
| `PressableScale` | Anything else tappable (avatars, rows, custom tiles): sinks on press, springs back. |
| `Loader` | The "un" loader, inline (in a row, next to text). `variant="write"` for creation moments. |
| `Loading` | A whole screen or section waiting, with an optional line in our voice: "Reading your essay…". |
| `Skeleton` / `SkeletonText` | Placeholders shaped like the content that's coming (lists, cards). |
| `ErrorState` / `EmptyState` | What went wrong (with Try again) / nothing here yet (with the action that adds something). |
| `Progress` | A plain iOS progress bar in our colours: `value`, optional `label` and `showValue`, `tone` accent (default) or ink. |
| `TopFade` | Over a SwiftUI form under the floating back button (Settings): what scrolls up fades into the page, like iOS 26's soft scroll edge. Native scroll views get this from iOS. |
| `Wordmark` / `Mark` | The logo, drawn from the artwork. Never type "Unive" in a font as a logo. |

Native controls stay native: SwiftUI forms, menus, switches, pickers, sheets and the floating glass `IconButton` are Apple's own design language, styled only through `tint` and our colours. Don't rebuild them.

## States

Every control has these, and the primitives already handle them; a custom tappable must too.

- **Pressed:** sinks to 0.96 (buttons) or 0.98 (cards, rows) and springs back with a slight overshoot; colours deepen one step (`fillPressed`, `accentPressed`). Buttons also give a light haptic tap on iOS.
- **Disabled:** 48% opacity, no press.
- **Loading:** the button keeps its size; its label squeezes and fades while the "un" grows out of the same spot. Long waits use `loadingLabel="Generating…"`.
- **Focused (fields):** mist turns white with a meadow ring and a soft halo.
- **Invalid (fields):** soft red fill, red ring, the message under the field; pair with `haptics.error()`.

Every screen that fetches has four states: **loading** (skeleton if you know the shape, `<Loading>` if not), **error** (`<ErrorState onRetry>`), **empty** (`<EmptyState>`), **content**. `<Loading>` waits 300 ms before showing, so fast loads never flash a loader. Never use a spinner.

## Motion

One curve for nearly everything: `easeUnive`, cubic-bezier(0.22, 1, 0.36, 1). It starts quickly and lands softly. Controls you press spring back with a slight overshoot, as on iOS; **nothing else overshoots and nothing bounces.**

- `duration.quick` (160 ms): press, toggles, colour changes.
- `duration.standard` (320 ms): sheets, cards, a label turning into a loader.
- `duration.slow` (700 ms): page entrances, artwork, progress moving on.
- Entrances rise and fade in, staggered: `entering={riseIn(0)}`, `riseIn(1)`, … (60 ms apart).
- Haptics: `tap` (finger lands on a button), `tick` (something snapped), `thud` (a heavy thing landed), `success`, `error`.
- Reduce Motion: loaders show the still icon, skeletons stop sweeping, entrances are skipped.
- Animate with Reanimated's `.get()` / `.set()` on shared values, never `.value =` (the React Compiler can skip those writes).
- A drawing that changes every frame (the loader) is drawn with **Skia** (`@shopify/react-native-skia`). Still artwork (the logo) uses `react-native-svg`. An animated SVG path makes React Native redo layout on every frame; six of them took the Design screen down to 6 fps.

## Screen rules

- No top bars. Content scrolls under the status bar and floating glass buttons; the page title (`<PageTitle>`) lives in the content.
- Cards must stand out: pages of cards use `colors.backgroundGrouped`.
- Compact cards with one strong title (`headline` or `title`) and small meta (`caption`). Tapping a card opens its full-screen page.
- Images fit their frame; don't crop whole figures.
- No developer info (backend URLs, debug rows) on any screen.

## Changing the system

- **A value is wrong or missing:** change it in `unive-brand` first, then copy it into `src/theme/palette.ts` and run `npm run brand:check`.
- **A screen needs something the system lacks** (a new colour role, a type step, a button variant): add it to `src/theme` or `src/components/ui` in its own commit, with a comment saying what it's for. Never work around it in the screen.
- **A genuine one-off** (an optical nudge, a size that scales with its container) may disable the lint rule on that line, with the reason: `// eslint-disable-next-line no-restricted-syntax -- initial scales with the avatar`.
- To see every component in every state, open the **Design** screen in a dev build: `unive:///design` (it doesn't exist in production builds).
