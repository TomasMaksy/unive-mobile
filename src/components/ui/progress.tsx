import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { discStep, ribbonBox, ribbonPath } from '@/brand/un-wave';
import { colors, duration, easeUnive } from '@/theme';

export type ProgressProps = {
  /** 0 to 100. */
  value: number;
  /** How many "un"s long the ribbon is. */
  periods?: number;
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Progress is written, not filled: an "ununun" wave at the logo's stroke
 * weight, inked from left to right up to `value`, flowing gently while it
 * waits. When the value changes the pen moves on smoothly.
 *
 * Drawn with Skia for the same reason as <Loader>: the path changes every frame.
 */
export function Progress({ value, periods = 6, color = colors.accent, accessibilityLabel = 'Progress', style }: ProgressProps) {
  const reduceMotion = useReducedMotion();
  const flow = useSharedValue(0);
  const shown = useSharedValue(value / 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    shown.set(withTiming(value / 100, { duration: duration.slow, easing: easeUnive }));
  }, [value, shown]);

  useEffect(() => {
    if (reduceMotion) return;
    flow.set(withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(flow);
  }, [reduceMotion, flow]);

  const B = useMemo(() => ribbonBox(periods), [periods]);
  const scale = width / B.width;
  const step = width > 0 ? discStep(scale) : 28;
  const track = useDerivedValue(() => ribbonPath(1, flow.get(), periods, step));
  const ink = useDerivedValue(() => ribbonPath(shown.get(), flow.get(), periods, step) || 'M0 0');

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[{ width: '100%', aspectRatio: B.width / B.height }, style]}>
      {width > 0 && (
        <Canvas style={{ flex: 1 }}>
          <Group transform={[{ scale }, { translateX: -B.x }, { translateY: -B.y }]}>
            <Path path={track} color={color} opacity={0.15} />
            <Path path={ink} color={color} />
          </Group>
        </Canvas>
      )}
    </View>
  );
}
