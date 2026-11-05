import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { alpha, colors, shape, space } from '@/theme';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  /** text: a line of text. block: an image or card. circle: an avatar. */
  shape?: 'text' | 'block' | 'circle';
  style?: StyleProp<ViewStyle>;
};

/**
 * A placeholder in the shape of content that's on its way: mist, with a
 * soft highlight sweeping across. Use it for lists and cards whose layout
 * you know, so the page doesn't jump when the data lands. For a wait with
 * no known shape, use <Loading />.
 */
export function Skeleton({ width = '100%', height, shape: kind = 'text', style }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const [w, setW] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    sweep.set(withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(sweep);
  }, [reduceMotion, sweep]);

  const highlight = useAnimatedStyle(() => ({
    transform: [{ translateX: -w + sweep.get() * 2 * w }],
  }));

  const h = height ?? (kind === 'text' ? 14 : kind === 'circle' ? width : 120);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[styles.base, kind === 'circle' ? shape.pill : kind === 'text' ? styles.text : shape.card, { width, height: h }, style]}>
      {!reduceMotion && w > 0 && <Animated.View style={[StyleSheet.absoluteFill, styles.sweep, highlight]} />}
    </View>
  );
}

/** A few lines of text, the last one shorter. */
export function SkeletonText({ lines = 3, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.lines, style]}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.fill, overflow: 'hidden' },
  text: { borderRadius: 6, borderCurve: 'continuous' },
  sweep: {
    experimental_backgroundImage: `linear-gradient(110deg, ${alpha('white', 0)} 30%, ${alpha('white', 0.64)} 50%, ${alpha('white', 0)} 70%)`,
  },
  lines: { gap: space[2] },
});
