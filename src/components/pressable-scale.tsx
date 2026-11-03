import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held: 0.97 for things tapped all the time, lower for occasional ones. */
  pressedScale?: number;
  /** A light tap of the haptic engine on touch-down. */
  haptic?: boolean;
};

/**
 * Press feedback for custom tappable things (avatars, cards), from Expo's
 * press-feedback recipe: it shrinks the moment your finger lands and springs
 * back with a slight overshoot when you let go. Native buttons get this from
 * iOS itself; see button.ios.tsx.
 */
export function PressableScale({
  pressedScale = 0.97,
  haptic = false,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      hitSlop={12}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        if (haptic && process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...rest}>
      <Animated.View style={[transition, style, { transform: [{ scale: pressed ? pressedScale : 1 }] }]}>
        {children as React.ReactNode}
      </Animated.View>
    </Pressable>
  );
}

// A Reanimated CSS transition: no gesture code, it just animates the scale change.
const transition = {
  transitionProperty: 'transform',
  transitionDuration: '160ms',
  // Eases out past 1 and settles: the slight bounce on release.
  transitionTimingFunction: cubicBezier(0.34, 1.56, 0.64, 1),
} as const;
