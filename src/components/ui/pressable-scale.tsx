import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { haptics, pressScale, transition } from '@/theme';

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far it sinks while held. Buttons 0.96, cards and rows 0.98. */
  pressedScale?: number;
  /** A light haptic tap when the finger lands. */
  haptic?: boolean;
};

/**
 * Press feedback for anything tappable that isn't a Button: it sinks the
 * moment a finger lands and springs back with a slight overshoot on release,
 * like iOS's own controls. Never leave a tappable thing without it.
 */
export function PressableScale({
  pressedScale = pressScale.card,
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
        if (haptic) haptics.tap();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...rest}>
      <Animated.View style={[transition.press, style, { transform: [{ scale: pressed ? pressedScale : 1 }] }]}>
        {children as React.ReactNode}
      </Animated.View>
    </Pressable>
  );
}
