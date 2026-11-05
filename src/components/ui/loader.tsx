import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
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

import { discStep, flowPath, iconPath, UN_VIEWBOX, writePath } from '@/brand/un-wave';
import { colors } from '@/theme';

export type LoaderProps = {
  /**
   * flow: the "un" travels along itself like a wave. The default for any wait.
   * write: a pen writes it, then lifts it off. For creation moments:
   * generating an essay, building a plan.
   */
  variant?: 'flow' | 'write';
  /** Height in points; the width follows the shape (about 1.5×). */
  size?: number;
  /** Any colour role or a colour from a component. Defaults to ink. */
  color?: string;
  paused?: boolean;
  /** Read by VoiceOver. Pass '' when a label next to it already says it. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Skia can't parse an empty string; this draws nothing.
const EMPTY = 'M0 0';

/**
 * The Unive loader: the icon's real centreline and stroke, traced from the
 * drawing, moving as a wave. Use it for every wait instead of a spinner.
 * With Reduce Motion on it shows the still icon.
 *
 * Drawn with Skia, not react-native-svg: the path changes every frame, and
 * Skia redraws it on the UI thread without a React Native layout pass
 * (an SVG path costs a full layout commit per frame and stalls the screen).
 */
export function Loader({
  variant = 'flow',
  size = 24,
  color = colors.text,
  paused = false,
  accessibilityLabel = 'Loading',
  style,
}: LoaderProps) {
  const reduceMotion = useReducedMotion();
  const still = paused || reduceMotion;
  const ms = variant === 'flow' ? 2400 : 2800;
  const B = UN_VIEWBOX;
  const scale = size / B.height;
  // Fewer discs when small; the edge stays smooth at any size.
  const step = discStep(scale);
  const phase = useSharedValue(variant === 'write' ? 0.5 : 0);

  useEffect(() => {
    if (still) {
      cancelAnimation(phase);
      return;
    }
    phase.set(0);
    phase.set(withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(phase);
  }, [still, ms, phase]);

  // The still frame: the whole icon, drawn once.
  const stillPath = useMemo(() => iconPath(step), [step]);

  const path = useDerivedValue(() => {
    if (still) return stillPath;
    return (variant === 'flow' ? flowPath(phase.get(), step) : writePath(phase.get(), step)) || EMPTY;
  });

  const width = (size * B.width) / B.height;
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel || undefined}
      style={[{ width, height: size }, style]}>
      <Canvas style={{ width, height: size }}>
        <Group transform={[{ scale }, { translateX: -B.x }, { translateY: -B.y }]}>
          <Path path={path} color={color} />
        </Group>
      </Canvas>
    </View>
  );
}
