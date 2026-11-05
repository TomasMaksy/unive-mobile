import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, type PaletteColor } from '@/theme';

// Solid down to the bottom of the floating back button (iOS's 44-point bar
// under the status bar), then clear over FADE, so nothing sharp sits behind it.
const SOLID = 44;
const FADE = 32;

/**
 * Content scrolling up under the status bar and the floating back button
 * fades into the page, like iOS 26's soft scroll edge. Screens with a native
 * scroll view get that from iOS; a SwiftUI form (Settings, Knowledge items)
 * doesn't, so its title would slide under the glass button, sharp. Put it
 * last, over the form, in the page's background colour.
 */
export function TopFade({ color = 'mist' }: { color?: PaletteColor }) {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const height = top + SOLID + FADE;
  const solidUntil = (top + SOLID) / height;

  return (
    <Canvas pointerEvents="none" style={[styles.fade, { height }]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[alpha(color, 1), alpha(color, 1), alpha(color, 0)]}
          positions={[0, solidUntil, 1]}
        />
      </Rect>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
});
