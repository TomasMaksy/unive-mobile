/**
 * The Unive brand palette, copied value for value from the brand book:
 * unive-brand/src/app/globals.css (github.com/TomasMaksy/unive-branding).
 *
 * This is the ONLY file in the app where a hex code may appear. Names match
 * the brand's CSS variables (`--meadow-soft` → `meadowSoft`), so web and
 * mobile speak the same language. `npm run brand:check` compares this file
 * with the brand repo and lists anything that has drifted.
 *
 * Screens don't import this directly: they use the roles in `colors.ts`
 * (`colors.text`, `colors.accent`), which say what a colour is *for*.
 */
export const palette = {
  // Neutrals: one warm grey ramp, paper to ink.
  paper: '#f9f9f7', // every page
  paperHover: '#f2f2ee',
  mist: '#efefea', // fills, secondary buttons, selected rows
  mistHover: '#e6e6e0',
  stone: '#939290', // calm solid grey: the "Generating…" button
  pebble: '#77716a', // captions, hints
  graphite: '#57524b', // body copy
  dusk: '#413a2d', // behind photos while they load
  ink: '#1d1b18', // warm black: logo, headings, primary buttons
  inkSoft: '#3a3631', // ink, pressed
  // Not a brand variable: stone at 88% with black, the web's pressed stone button.
  stoneDeep: '#81807f',
  white: '#ffffff',

  // Meadow: the one accent. There is no blue.
  meadow: '#6f7644',
  meadowLight: '#8b9460',
  meadowDark: '#4a5130',
  meadowSoft: '#eef0df',
  meadowInk: '#3a4124',

  // States: the only bright colours. Soft tint for fills, ink for text.
  success: '#3f9442',
  successSoft: '#e3f3df',
  successInk: '#1f5c22',
  warning: '#e09a12',
  warningSoft: '#fdf0d2',
  warningInk: '#7a4e00',
  danger: '#d9432b',
  dangerSoft: '#fceeec',
  dangerInk: '#c23a23',

  // Lines.
  border: '#e9e9e4',
  input: '#dcdcd5',
} as const;

export type PaletteColor = keyof typeof palette;

/**
 * A palette colour at an opacity, e.g. `alpha('ink', 0.16)` for a hairline.
 * Use this instead of writing rgba() by hand.
 */
export function alpha(color: PaletteColor, opacity: number): string {
  const hex = palette[color];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
