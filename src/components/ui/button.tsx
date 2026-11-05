import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Loader } from '@/components/ui/loader';
import { colors, easeUnive, fonts, haptics, pressScale, shape, transition } from '@/theme';

/**
 * Looks, from the brand book. Pick by intent, not by colour:
 *
 *   primary      Ink. The one main action on a screen.
 *   secondary    Mist. Its quiet partner, like iOS's grey buttons but warm.
 *   outline      White with a hairline: on cards.
 *   inverse      Solid white: on photos and ink panels.
 *   ghost        No fill: low-stakes actions in a row of others.
 *   accent       Meadow, for growth moments: plan ready, milestone reached.
 *   generating   Stone. With `loadingLabel`, the "Generating…" button.
 *   destructive  Danger red. Deleting, erasing, leaving.
 */
const variants = {
  primary: { bg: colors.inverse, bgPressed: colors.inversePressed, fg: colors.textInverse },
  secondary: { bg: colors.fill, bgPressed: colors.fillPressed, fg: colors.text },
  outline: { bg: colors.surface, bgPressed: colors.surfacePressed, fg: colors.text, border: colors.hairline },
  inverse: { bg: colors.surface, bgPressed: colors.background, fg: colors.text },
  ghost: { bg: colors.transparent, bgPressed: colors.pressedOverlay, fg: colors.text },
  accent: { bg: colors.accent, bgPressed: colors.accentPressed, fg: colors.textInverse },
  generating: { bg: colors.generating, bgPressed: colors.generatingPressed, fg: colors.surface },
  destructive: { bg: colors.danger, bgPressed: colors.dangerPressed, fg: colors.surface },
} as const;

/** Text grows with the button, as on iOS. Control-specific sizes live with the control. */
const sizes = {
  sm: { height: 34, paddingHorizontal: 14, gap: 6, fontSize: 14, loader: 13 },
  md: { height: 44, paddingHorizontal: 20, gap: 8, fontSize: 15, loader: 16 },
  lg: { height: 52, paddingHorizontal: 24, gap: 8, fontSize: 17, loader: 18 },
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  /** sm: inside rows and cards. md: the default. lg: a screen's main call to action. */
  size?: ButtonSize;
  /** An SF Symbol before the label, e.g. 'plus'. */
  icon?: SFSymbol;
  /** The label turns into the "un" loader and back. The button keeps its size. */
  loading?: boolean;
  /** For long waits: show the "un" beside this label instead, e.g. "Generating…". */
  loadingLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
  /** Size to the label instead of filling the width. */
  inline?: boolean;
  /** A light haptic tap on touch-down. On by default. */
  haptic?: boolean;
  /** Layout only (margins, flex). Not colours: add a variant instead. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The brand button: a capsule at every size. It sinks a touch when pressed
 * and springs back on release; while loading, the label squeezes to the
 * centre and fades while the "un" grows out of the same spot.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  loadingLabel,
  disabled = false,
  onPress,
  inline = false,
  haptic = true,
  style,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const v = variants[variant];
  const s = sizes[size];
  const generating = loading && loadingLabel != null;
  const morphing = loading && !generating;
  const inactive = disabled || loading;

  // Two clocks, as in the brand book: the fade lands softly; the scale
  // overshoots a touch, so the label seems to turn into the loader.
  const fade = useSharedValue(0);
  const morph = useSharedValue(0);

  // The loader is only mounted while it's showing (and fading out), so a
  // screen of idle buttons carries no drawing canvases.
  const [loaderMounted, setLoaderMounted] = useState(false);
  if (morphing && !loaderMounted) setLoaderMounted(true);

  useEffect(() => {
    fade.set(
      withTiming(morphing ? 1 : 0, { duration: 260, easing: easeUnive }, (finished) => {
        if (finished && !morphing) scheduleOnRN(setLoaderMounted, false);
      }),
    );
    morph.set(withTiming(morphing ? 1 : 0, { duration: 420, easing: Easing.bezier(0.3, 1.3, 0.5, 1) }));
  }, [morphing, fade, morph]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - fade.get(),
    transform: [{ scaleX: 1 - 0.45 * morph.get() }, { scaleY: 1 - 0.2 * morph.get() }],
  }));
  const loaderStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ scale: 1.8 - 0.8 * morph.get() }],
  }));

  const labelText = { fontFamily: fonts.sansMedium, fontSize: s.fontSize, color: v.fg };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={generating ? loadingLabel : label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={size === 'sm' ? 6 : 0}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        if (haptic) haptics.tap();
      }}
      onPressOut={() => setPressed(false)}
      style={[inline ? styles.inline : styles.stretch, style]}>
      <Animated.View
        style={[
          styles.button,
          transition.control,
          {
            height: s.height,
            paddingHorizontal: s.paddingHorizontal,
            backgroundColor: pressed ? v.bgPressed : v.bg,
            borderColor: 'border' in v ? v.border : colors.transparent,
            opacity: disabled ? 0.48 : 1,
            transform: [{ scale: pressed ? pressScale.button : 1 }],
          },
        ]}>
        <Animated.View style={[styles.row, { gap: s.gap }, labelStyle]}>
          {generating ? (
            <>
              <Loader size={s.loader} color={v.fg} accessibilityLabel="" />
              <Text style={labelText} numberOfLines={1}>
                {loadingLabel}
              </Text>
            </>
          ) : (
            <>
              {icon && <SymbolView name={icon} size={s.fontSize * 1.1} tintColor={v.fg} />}
              <Text style={labelText} numberOfLines={1}>
                {label}
              </Text>
            </>
          )}
        </Animated.View>
        {loaderMounted && (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, loaderStyle]}>
            <Loader size={s.loader} color={v.fg} accessibilityLabel="" />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stretch: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  button: {
    ...shape.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
