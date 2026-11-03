import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/** A white input with a hairline border that darkens on focus, like the website's. */
export function TextField({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={Colors.textMuted}
      selectionColor={Colors.text}
      style={[styles.input, focused && styles.focused, style]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElement,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.text,
  },
  focused: {
    borderColor: Colors.text,
  },
});
