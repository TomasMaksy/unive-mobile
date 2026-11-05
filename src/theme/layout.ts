import type { ViewStyle } from 'react-native';

import { alpha } from './palette';

/**
 * Spacing on a 4-point grid, named like Tailwind so it reads the same as the
 * website: `space[4]` is 16, `space[6]` is 24. If a layout needs a value
 * between steps, use the nearest step.
 */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Side padding of every screen. */
export const screenPadding = space[5];

/**
 * Corners. Every shape uses iOS's continuous curve (a squircle, like app
 * icons). Spread one into a style: `{ ...shape.card, padding: space[4] }`.
 */
export const shape = {
  /** Buttons, inputs, chips, badges: fully round ends, as on iOS. */
  pill: { borderRadius: 999, borderCurve: 'continuous' },
  /** Small tiles: thumbnails, icons in a square. */
  tile: { borderRadius: 12, borderCurve: 'continuous' },
  /** Chat bubbles and multi-line inputs. */
  bubble: { borderRadius: 22, borderCurve: 'continuous' },
  /** Cards. */
  card: { borderRadius: 24, borderCurve: 'continuous' },
  /** A mist tray that holds cards; large surfaces like the sign-in panel. */
  panel: { borderRadius: 32, borderCurve: 'continuous' },
} as const satisfies Record<string, ViewStyle>;

/** Warm shadows from the brand: brown-tinted, soft, never grey. */
export const shadow = {
  /** Small things that float a little: a chip over a photo. */
  xs: `0 1px 4px ${alpha('dusk', 0.1)}`,
  /** Cards on paper. */
  card: `0 10px 32px ${alpha('dusk', 0.07)}`,
  /** Raised: a floating bar, a dragged card. */
  raised: `0 14px 44px ${alpha('dusk', 0.14)}`,
  /** Framed artwork and photos. */
  frame: `0 24px 80px ${alpha('ink', 0.18)}`,
} as const;

/** The smallest comfortable touch target, per Apple's HIG. */
export const minTouch = 44;
