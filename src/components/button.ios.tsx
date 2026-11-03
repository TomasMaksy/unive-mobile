import { Host } from '@expo/ui';
import { Button as SwiftUIButton, ProgressView, Text } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  frame,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import type { ButtonProps } from '@/components/button';
import { Colors } from '@/constants/theme';

// iOS 26's glass button styles come with the system's bouncy press; older
// iOS gets the classic filled/bordered styles, which highlight on press.
const glass = isLiquidGlassAvailable();

/** A real SwiftUI button, so it looks and responds exactly like iOS's own. */
export function Button({ label, variant = 'primary', loading, disabled, onPress, inline, style }: ButtonProps) {
  const primary = variant === 'primary';

  return (
    <Host matchContents={inline ? true : { vertical: true }} style={[inline ? null : { alignSelf: 'stretch' }, style]}>
      <SwiftUIButton
        onPress={onPress}
        modifiers={[
          buttonStyle(primary ? (glass ? 'glassProminent' : 'borderedProminent') : glass ? 'glass' : 'bordered'),
          buttonBorderShape('capsule'),
          controlSize('large'),
          tint(primary ? Colors.text : Colors.backgroundSelected),
          disabledModifier(disabled || loading),
        ]}>
        {loading ? (
          <ProgressView modifiers={[tint(primary ? '#ffffff' : Colors.text), stretch(inline)]} />
        ) : (
          <Text
            modifiers={[
              font({ size: 17, weight: 'semibold' }),
              ...(primary ? [] : [tint(Colors.text)]),
              stretch(inline),
            ]}>
            {label}
          </Text>
        )}
      </SwiftUIButton>
    </Host>
  );
}

// Full-width buttons let their label area fill the row, so the whole capsule is tappable.
function stretch(inline: boolean | undefined) {
  return inline ? frame({ minHeight: 22 }) : frame({ maxWidth: 10000, minHeight: 22 });
}
