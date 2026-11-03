import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';

export type ButtonProps = {
  label: string;
  /** primary: solid black. secondary: white with a hairline border (glass on iOS 26). */
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Size to the label instead of filling the width. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Android and web fallback. On iOS, button.ios.tsx renders a real SwiftUI
 * button instead (Metro picks the .ios file automatically).
 */
export function Button({ label, variant = 'primary', loading, disabled, onPress, inline, style }: ButtonProps) {
  const primary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.button,
        primary ? styles.primary : styles.secondary,
        inline ? styles.inline : styles.stretch,
        inactive && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? '#ffffff' : Colors.text} />
      ) : (
        <Text style={[styles.label, { color: primary ? '#ffffff' : Colors.text }]}>{label}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    ...Shape.pill,
    minHeight: 50,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  inline: {
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: Colors.text,
  },
  secondary: {
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
  },
});
