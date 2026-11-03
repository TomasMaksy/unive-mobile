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

/**
 * A round native button with an SF Symbol: glass with the system's bounce on
 * iOS 26. 40pt across, the same as the avatar in screen-header.tsx.
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
          accessibilityLabelModifier(accessibilityLabel),
        ]}>
        <Image
          systemName={systemImage}
          modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(Colors.text), frame({ width: 26, height: 26 })]}
        />
      </Button>
    </Host>
  );
}
