import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, pressScale, shadow, shape, space } from '@/theme';

export type CardProps = Omit<ViewProps, 'style'> & {
  /** Makes the whole card tappable, with press feedback. Tapping a card opens its full-screen page. */
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  /**
   * raised: white with the warm shadow, on paper. The default.
   * flat: white with no shadow, inside a mist tray or on a grouped page.
   * quiet: a mist fill, for a secondary block on a white surface.
   */
  tone?: 'raised' | 'flat' | 'quiet';
  /** Inner padding. 'none' for cards that start with an edge-to-edge image. */
  padding?: 'none' | 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/**
 * The brand card: a white squircle with the warm shadow and no border. Keep
 * cards compact, with one strong title and small meta under it.
 */
export function Card({ onPress, onLongPress, accessibilityLabel, tone = 'raised', padding = 'md', style, children, ...rest }: CardProps) {
  const look = [styles.card, styles[tone], styles[`pad_${padding}`], style];
  if (onPress || onLongPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        pressedScale={pressScale.card}
        onPress={onPress}
        onLongPress={onLongPress}
        style={look}
        {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={look} {...rest}>
      {children}
    </View>
  );
}

/**
 * A mist tray that holds a few flat cards under one heading, 6pt apart,
 * like grouped rows on iOS.
 */
export function CardGroup({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.group, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...shape.card, overflow: 'hidden' },
  raised: { backgroundColor: colors.surface, boxShadow: shadow.card },
  flat: { backgroundColor: colors.surface },
  quiet: { backgroundColor: colors.fill },
  pad_none: {},
  pad_sm: { padding: space[3] },
  pad_md: { padding: space[4] },
  group: { ...shape.panel, backgroundColor: colors.fill, padding: space[1.5], gap: space[1.5] },
});
