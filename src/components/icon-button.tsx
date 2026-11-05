import type { SFSymbol } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { PressableScale, Text } from '@/components/ui';
import { colors, shape } from '@/theme';

export type IconButtonProps = {
  /** SF Symbol name, e.g. 'xmark'. */
  systemImage: SFSymbol;
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * Android and web fallback: a round button with a text glyph. On iOS,
 * icon-button.ios.tsx renders a native SwiftUI button with the SF Symbol.
 */
export function IconButton({ accessibilityLabel, onPress }: IconButtonProps) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.button}>
      <Text variant="headline">✕</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    ...shape.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
});
