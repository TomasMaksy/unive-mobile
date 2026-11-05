import { useState, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { colors, duration, fonts, shape, space } from '@/theme';

export type FieldProps = Omit<ComponentProps<typeof TextInput>, 'style' | 'editable'> & {
  /** A label above the field. */
  label?: string;
  /** A quiet hint under the field. Replaced by `error` when there is one. */
  hint?: string;
  /** Turns the field red and says what's wrong under it. */
  error?: string | null;
  disabled?: boolean;
  size?: 'md' | 'lg';
  /** Layout only. */
  style?: StyleProp<ViewStyle>;
  /** For one-off text styling inside the input, like a code's wide letter spacing. */
  inputStyle?: ComponentProps<typeof TextInput>['style'];
};

/**
 * The brand's text field, like an iOS field but warm: a mist capsule with no
 * border. Focused, it turns white with a meadow ring and a soft halo;
 * invalid, it turns red. Every change eases, never snaps.
 */
export function Field({
  ref,
  label,
  hint,
  error,
  disabled,
  size = 'md',
  style,
  inputStyle,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const invalid = !!error;
  const ring = invalid ? colors.danger : focused ? colors.focus : colors.transparent;
  const halo = invalid ? colors.dangerHalo : colors.focusHalo;

  return (
    <View style={[styles.wrap, style]}>
      {label && (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View>
        {/* The halo sits behind the field and shows as a soft 4pt ring. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            multiline ? shape.bubble : shape.pill,
            { backgroundColor: halo, opacity: focused ? 1 : 0 },
            { transitionProperty: 'opacity', transitionDuration: duration.quick },
          ]}
        />
        <Animated.View
          style={[
            multiline ? shape.bubble : shape.pill,
            styles.control,
            {
              minHeight: size === 'lg' ? 52 : 44,
              backgroundColor: focused ? colors.surface : invalid ? colors.dangerSoft : colors.fill,
              borderColor: ring,
              opacity: disabled ? 0.48 : 1,
            },
            {
              transitionProperty: ['backgroundColor', 'borderColor', 'opacity'],
              transitionDuration: duration.quick,
              transitionTimingFunction: 'ease-out',
            },
          ]}>
          <TextInput
            ref={ref}
            editable={!disabled}
            multiline={multiline}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            aria-invalid={invalid}
            style={[styles.input, size === 'lg' && styles.inputLarge, multiline && styles.multiline, inputStyle]}
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
        </Animated.View>
      </View>
      {(error || hint) && (
        <Animated.View key={error ? 'error' : 'hint'} entering={FadeIn.duration(duration.quick)} exiting={FadeOut.duration(duration.quick)}>
          <Text
            variant="caption"
            color={error ? 'dangerText' : 'textMuted'}
            style={styles.message}
            accessibilityLiveRegion={error ? 'polite' : undefined}>
            {error || hint}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1.5] },
  label: { paddingHorizontal: space[4] },
  halo: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4 },
  control: {
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
  },
  inputLarge: { paddingHorizontal: space[5], fontSize: 17 },
  multiline: { minHeight: 96, paddingTop: space[3], textAlignVertical: 'top' },
  message: { paddingHorizontal: space[4] },
});
