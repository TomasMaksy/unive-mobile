/**
 * The design system's single entry point: `import { colors, type, space } from '@/theme'`.
 * Values come from the brand book (unive-brand); see DESIGN.md for the rules.
 */
export { alpha, palette, type PaletteColor } from './palette';
export { colors, fade, type ColorRole } from './colors';
export { fontFiles, fonts, serifTracking, type, type TypeVariant } from './typography';
export { minTouch, screenPadding, shadow, shape, space } from './layout';
export { duration, easeUnive, easeUniveCurve, pressScale, riseIn, spring, transition } from './motion';
export { haptics } from './haptics';
