/**
 * The unive brand, taken from the web app (unive-v22/src/app/globals.css and
 * the /login page). The website is light-only, so the app is too.
 */

import '@/global.css';

import { AveriaSerifLibre_300Light } from '@expo-google-fonts/averia-serif-libre/300Light';
import { AveriaSerifLibre_400Regular } from '@expo-google-fonts/averia-serif-libre/400Regular';
import { AveriaSerifLibre_700Bold } from '@expo-google-fonts/averia-serif-libre/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

export const Colors = {
  /** neutral-950: text and primary buttons */
  text: '#0a0a0a',
  /** neutral-600: supporting copy */
  textSecondary: '#525252',
  /** neutral-400: placeholders and hints */
  textMuted: '#a3a3a3',
  /** --background / --surface: the warm off-white page */
  background: '#f9f9f7',
  /** cards, inputs and chat bubbles sit on white */
  backgroundElement: '#ffffff',
  /** --surface-hover */
  backgroundSelected: '#ececea',
  /** neutral-200 */
  border: '#e5e5e5',
  /** --brand-blue: links and highlights */
  brandBlue: '#4893f9',
  /** --brand-blue-soft */
  brandBlueSoft: '#eef4ff',
  /** --roadmap-olive: the landing page's forest greens */
  olive: '#6f7644',
  /** --destructive (red-600) */
  destructive: '#e7000b',
} as const;

export type ThemeColor = keyof typeof Colors;

/**
 * React Native picks a font by family name, not by fontWeight, so each weight
 * is its own family. Load them all with `FontFiles` before rendering text.
 */
export const Fonts = {
  /** Averia Serif Libre: headings and the wordmark */
  headingLight: 'AveriaSerifLibre_300Light',
  heading: 'AveriaSerifLibre_400Regular',
  headingBold: 'AveriaSerifLibre_700Bold',
  /** Inter: everything else */
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

export const FontFiles = {
  [Fonts.headingLight]: AveriaSerifLibre_300Light,
  [Fonts.heading]: AveriaSerifLibre_400Regular,
  [Fonts.headingBold]: AveriaSerifLibre_700Bold,
  [Fonts.sans]: Inter_400Regular,
  [Fonts.sansMedium]: Inter_500Medium,
  [Fonts.sansSemiBold]: Inter_600SemiBold,
};

/**
 * Corners use iOS's continuous curve (a squircle, like app icons) instead of
 * a circular arc. Spread one into a style: `{ ...Shape.card, padding: 16 }`.
 */
export const Shape = {
  /** buttons, inputs and chips: fully rounded ends */
  pill: { borderRadius: 999, borderCurve: 'continuous' },
  /** cards */
  card: { borderRadius: 24, borderCurve: 'continuous' },
  /** large surfaces, like the sign-in card */
  panel: { borderRadius: 32, borderCurve: 'continuous' },
  /** chat bubbles and inputs that grow to several lines */
  bubble: { borderRadius: 22, borderCurve: 'continuous' },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

