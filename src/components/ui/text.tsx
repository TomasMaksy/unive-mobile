import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, type ColorRole, type, type TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  /** A step of the type scale. See src/theme/typography.ts. */
  variant?: TypeVariant;
  /** A colour role. Defaults to `text` (ink); body copy usually wants `textSecondary`. */
  color?: ColorRole;
  align?: 'left' | 'center' | 'right';
};

/**
 * All text in the app goes through this, so every size, font and tracking
 * comes from the brand's type scale. `style` is for layout (margins, flex,
 * numberOfLines tweaks), not for a new font size: if you need one, the
 * scale is missing a step.
 */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  return <RNText style={[type[variant], { color: colors[color] }, align && { textAlign: align }, style]} {...rest} />;
}
