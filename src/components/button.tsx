import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type ButtonProps = PressableProps & {
  label: string;
  /** primary: black, like the website's main buttons. secondary: white with a hairline border. */
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const primary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={primary ? '#ffffff' : Colors.text} />
      ) : (
        <Text style={[styles.label, { color: primary ? '#ffffff' : Colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.text,
  },
  secondary: {
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
  },
});
