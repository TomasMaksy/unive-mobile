import { alpha, palette } from './palette';

/**
 * Colour roles: what each colour is *for*. Screens and components use these,
 * never the palette or a hex. If no role fits, add one here (and say why)
 * rather than reaching for a raw value.
 *
 * Proportions on a screen, from the brand book: paper ~70%, ink ~18%,
 * mist ~8%, meadow ~4%. Meadow is the only accent; states are the only
 * bright colours. The app is light-only, like the website.
 */
export const colors = {
  // ---- Surfaces ---------------------------------------------------------
  /** Every page. */
  background: palette.paper,
  /** Pages made of cards (profile, settings, guide): a step darker, so white cards stand out. */
  backgroundGrouped: palette.mist,
  /** Cards, sheets, inputs while focused, chat bubbles. */
  surface: palette.white,
  /** A surface while pressed. */
  surfacePressed: palette.paperHover,
  /** Quiet fill: secondary buttons, chips, selected rows, idle inputs. */
  fill: palette.mist,
  fillPressed: palette.mistHover,
  /** Ink panels and the primary button. */
  inverse: palette.ink,
  inversePressed: palette.inkSoft,
  /** The "Generating…" button: a calm solid grey. */
  generating: palette.stone,
  generatingPressed: palette.stoneDeep,
  /** A ghost button or plain row while pressed. */
  pressedOverlay: alpha('ink', 0.07),
  /** A see-through fill that shows on paper, mist and white alike, like iOS's systemFill: progress tracks, an avatar without a photo. */
  track: alpha('ink', 0.1),
  /** Behind photos while they load. */
  placeholder: palette.dusk,

  // ---- Text -------------------------------------------------------------
  /** Headings and main text. */
  text: palette.ink,
  /** Body copy. */
  textSecondary: palette.graphite,
  /** Captions, hints, placeholders, metadata. */
  textMuted: palette.pebble,
  /** Text on ink, meadow or a photo. */
  textInverse: palette.paper,

  // ---- Accent (meadow) --------------------------------------------------
  /** Progress, growth, focus: the one accent. */
  accent: palette.meadow,
  accentPressed: palette.meadowDark,
  /** Current step, gentle highlight. */
  accentSoft: palette.meadowSoft,
  /** Text on accentSoft. */
  accentText: palette.meadowInk,
  /** Charts, secondary marks. */
  accentLight: palette.meadowLight,

  // ---- Lines ------------------------------------------------------------
  /** Dividers and card edges. */
  border: palette.border,
  /** Input outlines. */
  borderStrong: palette.input,
  /** Outline buttons, on white or paper. */
  hairline: alpha('ink', 0.16),
  hairlineStrong: alpha('ink', 0.28),
  /** Focus ring. */
  focus: palette.meadow,
  focusHalo: alpha('meadow', 0.16),

  // ---- States -----------------------------------------------------------
  success: palette.success,
  successSoft: palette.successSoft,
  successText: palette.successInk,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  warningText: palette.warningInk,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  dangerText: palette.dangerInk,
  dangerPressed: palette.dangerInk,
  dangerHalo: alpha('danger', 0.16),

  // ---- Overlays ---------------------------------------------------------
  /** Dims the page behind a custom sheet. */
  backdrop: alpha('ink', 0.32),
  /** Darkens a photo so text on it stays readable. Only ever over imagery. */
  scrim: alpha('ink', 0.55),
  /** Glass and frosted chrome over paper. */
  paperGlass: alpha('paper', 0.75),
  /** Fills and lines on ink, meadow or a photo. */
  onInverseFill: alpha('white', 0.16),
  onInverseFillStrong: alpha('white', 0.25),
  onInverseMuted: alpha('white', 0.72),
  /** Fully transparent, for gradients that fade out. */
  transparent: 'transparent',
} as const;

export type ColorRole = keyof typeof colors;

/** A gradient from a colour to clear, e.g. the fade under a floating header. */
export function fade(color: Parameters<typeof alpha>[0], from = 1, to = 0): [string, string] {
  return [alpha(color, from), alpha(color, to)];
}
