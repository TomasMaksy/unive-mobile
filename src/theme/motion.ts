import { cubicBezier, Easing, withDelay, withTiming, type CSSTransitionProperties } from 'react-native-reanimated';

/**
 * Motion, from the brand book: one curve for nearly everything, which starts
 * quickly and lands softly. Controls you press spring back with a slight
 * overshoot, as on iOS; nothing else overshoots, and nothing bounces.
 */

/** The brand curve, as numbers: cubic-bezier(0.22, 1, 0.36, 1). */
export const easeUniveCurve = [0.22, 1, 0.36, 1] as const;

/** For `withTiming(…, { easing })` and layout animations. */
export const easeUnive = Easing.bezier(...easeUniveCurve);

export const duration = {
  /** Press, toggles, colour changes. */
  quick: 160,
  /** Menus, sheets, cards, a label turning into a loader. */
  standard: 320,
  /** Page entrances, artwork. */
  slow: 700,
} as const;

/**
 * Reanimated CSS-transition presets: spread into an Animated.View's style
 * and the listed properties animate whenever they change.
 */
export const transition: Record<'colors' | 'control' | 'press', CSSTransitionProperties> = {
  /** Colours and opacity: background, border, focus. */
  colors: {
    transitionProperty: ['backgroundColor', 'borderColor', 'opacity'],
    transitionDuration: duration.quick,
    transitionTimingFunction: 'ease-out',
  },
  /** A pressable control: colours ease quickly, the press springs. */
  control: {
    transitionProperty: ['backgroundColor', 'borderColor', 'opacity', 'transform'],
    transitionDuration: [160, 160, 160, 300],
    transitionTimingFunction: ['ease-out', 'ease-out', 'ease-out', cubicBezier(0.3, 1.4, 0.5, 1)],
  },
  /** Press feedback: shrinks fast, springs back past 1 and settles. */
  press: {
    transitionProperty: 'transform',
    transitionDuration: 300,
    transitionTimingFunction: cubicBezier(0.3, 1.4, 0.5, 1),
  },
};

/** How far tappable things sink while held. */
export const pressScale = {
  /** Buttons. */
  button: 0.96,
  /** Cards and rows, which are bigger, so they move less. */
  card: 0.98,
} as const;

/** Springs for gestures and things that follow a finger. Critically damped: no bounce. */
export const spring = {
  /** Sheets and panels settling after a drag. */
  settle: { damping: 30, stiffness: 300, mass: 1 },
  /** Small things snapping into place. */
  snap: { damping: 22, stiffness: 400, mass: 0.6 },
} as const;

/**
 * The brand's entrance: rise and fade in, staggered top to bottom. Pass it
 * as `entering` on an Animated.View; `order` staggers siblings 60ms apart.
 *
 *   <Animated.View entering={riseIn(0)}>…title…</Animated.View>
 *   <Animated.View entering={riseIn(1)}>…first card…</Animated.View>
 *
 * Reduce Motion skips it (Reanimated's default for timing animations).
 */
export function riseIn(order = 0, distance = 12) {
  return () => {
    'worklet';
    const config = { duration: 550, easing: easeUnive };
    const delay = order * 60;
    return {
      initialValues: { opacity: 0, transform: [{ translateY: distance }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, config)),
        transform: [{ translateY: withDelay(delay, withTiming(0, config)) }],
      },
    };
  };
}
