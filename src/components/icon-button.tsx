import type { SFSymbol } from 'expo-symbols';
import { StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Shape } from '@/constants/theme';

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
      <Text style={styles.glyph}>✕</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    ...Shape.pill,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSelected,
  },
  glyph: {
    fontSize: 17,
    color: Colors.text,
  },
});
