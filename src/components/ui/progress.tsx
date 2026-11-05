import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { colors, duration, easeUnive, shape, space } from '@/theme';

export type ProgressProps = {
  /** 0 to 100. */
  value: number;
  /** A label above the bar, on the left, like iOS's ProgressView("Loading"). */
  label?: string;
  /** Show the percentage above the bar, on the right. */
  showValue?: boolean;
  /** accent (meadow) by default, as iOS uses the app's tint; ink for neutral tasks. */
  tone?: 'accent' | 'ink';
  /** Read by VoiceOver when there's no visible label. */
  accessibilityLabel?: string;
  /** Layout only. */
  style?: StyleProp<ViewStyle>;
};

const tones = { accent: colors.accent, ink: colors.text } as const;

/**
 * A plain iOS-style progress bar: a thin capsule track, filled from the left
 * in the brand's colour. When the value changes the fill glides to it.
 *
 * The fill is a full-width capsule slid in from the left (a transform, not a
 * width change), so it never triggers a layout pass while it moves.
 */
export function Progress({ value, label, showValue = false, tone = 'accent', accessibilityLabel, style }: ProgressProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  // Measured on the UI side, so the fill's position never waits for a re-render.
  const width = useSharedValue(0);
  const shown = useSharedValue(clamped / 100);

  useEffect(() => {
    const to = clamped / 100;
    shown.set(reduceMotion ? to : withTiming(to, { duration: duration.slow, easing: easeUnive }));
  }, [clamped, reduceMotion, shown]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: width.get() > 0 ? 1 : 0,
    transform: [{ translateX: (shown.get() - 1) * width.get() }],
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? accessibilityLabel ?? 'Progress'}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.wrap, style]}>
      {(label || showValue) && (
        <View style={styles.header}>
          <Text variant="label">{label}</Text>
          {showValue && (
            <Text variant="label" color="textSecondary" style={styles.number}>
              {`${Math.round(clamped)}%`}
            </Text>
          )}
        </View>
      )}
      <View style={styles.track} onLayout={(e) => width.set(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.fill, { backgroundColor: tones[tone] }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: space[2] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  // Digits that don't shift as the number changes.
  number: { fontVariant: ['tabular-nums'] },
  track: { ...shape.pill, height: 6, overflow: 'hidden', backgroundColor: colors.track },
  fill: { ...shape.pill, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
});
