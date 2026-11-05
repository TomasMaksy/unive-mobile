import type { TextStyle } from 'react-native';

import { AveriaSerifLibre_300Light } from '@expo-google-fonts/averia-serif-libre/300Light';
import { AveriaSerifLibre_400Regular } from '@expo-google-fonts/averia-serif-libre/400Regular';
import { AveriaSerifLibre_400Regular_Italic } from '@expo-google-fonts/averia-serif-libre/400Regular_Italic';
import { AveriaSerifLibre_700Bold } from '@expo-google-fonts/averia-serif-libre/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

/**
 * React Native picks a font by family name, not by fontWeight, so each
 * weight is its own family. All of them load in the root layout before the
 * first screen renders (`fontFiles`).
 *
 * Averia Serif Libre is the voice: headings, leads, quotes, numbers that
 * matter. Inter does the interface work: buttons, labels, forms, body text.
 */
export const fonts = {
  headingLight: 'AveriaSerifLibre_300Light',
  heading: 'AveriaSerifLibre_400Regular',
  headingItalic: 'AveriaSerifLibre_400Regular_Italic',
  headingBold: 'AveriaSerifLibre_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  /** Only for tiny counts and badges, per the brand book. */
  sansSemiBold: 'Inter_600SemiBold',
} as const;

export const fontFiles = {
  [fonts.headingLight]: AveriaSerifLibre_300Light,
  [fonts.heading]: AveriaSerifLibre_400Regular,
  [fonts.headingItalic]: AveriaSerifLibre_400Regular_Italic,
  [fonts.headingBold]: AveriaSerifLibre_700Bold,
  [fonts.sans]: Inter_400Regular,
  [fonts.sansMedium]: Inter_500Medium,
  [fonts.sansSemiBold]: Inter_600SemiBold,
};

/** Averia is always tracked in by 3% of its size, like the website. */
export const serifTracking = (size: number) => size * -0.03;

function serif(fontFamily: string, fontSize: number, leading: number): TextStyle {
  return { fontFamily, fontSize, lineHeight: Math.round(fontSize * leading), letterSpacing: serifTracking(fontSize) };
}

function sans(fontFamily: string, fontSize: number, lineHeight: number): TextStyle {
  return { fontFamily, fontSize, lineHeight };
}

/**
 * The type scale. Same names as the website's `type-*` utilities
 * (unive-v22 globals.css), at their phone sizes. Use these through
 * `<Text variant="…">`; never set fontSize or fontFamily in a screen.
 *
 *   display   Averia 300 · 44   hero moments only (sign-in, empty states)
 *   h1        Averia 400 · 40   rare, heavy moments
 *   h2        Averia 300 · 34   page titles
 *   h3        Averia 300 · 28   big section headings
 *   title     Averia 300 · 24   card and section titles, sheet titles
 *   lead      Averia 300 · 18   the intro line under a heading
 *   headline  Inter 500 · 17    row and compact-card titles, emphasised body
 *   body      Inter 400 · 16    body copy
 *   callout   Inter 400 · 15    dense body: list rows, chat
 *   small     Inter 400 · 14    secondary copy
 *   label     Inter 500 · 14    form labels, chips, small buttons
 *   caption   Inter 400 · 12    meta, timestamps, hints
 *   eyebrow   Inter 500 · 11    caps label above a heading
 *   count     Inter 600 · 12    tiny counts in badges
 */
export const type = {
  display: serif(fonts.headingLight, 44, 1.05),
  h1: serif(fonts.heading, 40, 1.05),
  h2: serif(fonts.headingLight, 34, 1.12),
  h3: serif(fonts.headingLight, 28, 1.15),
  title: serif(fonts.headingLight, 24, 1.2),
  lead: serif(fonts.headingLight, 18, 1.45),
  headline: sans(fonts.sansMedium, 17, 22),
  body: sans(fonts.sans, 16, 24),
  callout: sans(fonts.sans, 15, 21),
  small: sans(fonts.sans, 14, 20),
  label: sans(fonts.sansMedium, 14, 18),
  caption: sans(fonts.sans, 12, 16),
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14, letterSpacing: 11 * 0.14, textTransform: 'uppercase' },
  count: sans(fonts.sansSemiBold, 12, 16),
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
