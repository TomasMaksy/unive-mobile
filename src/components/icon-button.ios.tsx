import { Host } from '@expo/ui';
import { Button, Image } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as accessibilityLabelModifier,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import type { IconButtonProps } from '@/components/icon-button';
import { Colors } from '@/constants/theme';

const glass = isLiquidGlassAvailable();
export const SIZE = 44;

/**
 * A round native button with an SF Symbol: glass with the system's bounce on
 * iOS 26. 44pt across (Apple's minimum tap target), the same as the avatar in
 * screen-header.tsx, with a 17pt symbol like the system's bar buttons.
 */
export function IconButton({ systemImage, accessibilityLabel, onPress }: IconButtonProps) {
  return (
    // React Native places this; SwiftUI shouldn't add safe-area spacing of its own.
    <Host matchContents ignoreSafeArea="all">
      <Button
        onPress={onPress}
        modifiers={[
          buttonStyle(glass ? 'glass' : 'bordered'),
          buttonBorderShape('circle'),
          controlSize('regular'),
          // iOS pads a bordered button's sides, so it'd be wider than its circle; keep it square.
          frame({ width: SIZE, height: SIZE }),
          accessibilityLabelModifier(accessibilityLabel),
        ]}>
        <Image
          systemName={systemImage}
          modifiers={[font({ size: 17, weight: 'medium' }), foregroundStyle(Colors.text), frame({ width: 30, height: 30 })]}
        />
      </Button>
    </Host>
  );
}
