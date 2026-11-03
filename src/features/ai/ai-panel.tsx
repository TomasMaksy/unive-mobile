import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { createContext, use, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { Colors, Fonts } from '@/constants/theme';
import { AiChat } from '@/features/ai/ai-chat';

/** How far past the top you pull before letting go opens the AI. */
const OPEN_THRESHOLD = 110;
/** How far up you drag the open AI before letting go closes it. */
const CLOSE_THRESHOLD = 110;

// Expo's "strong ease-out for UI": fast to respond, gentle to settle, no bounce.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type AiPanelContextValue = {
  /** How far the current tab is pulled down past its top, in points. */
  pull: SharedValue<number>;
  /** True while the AI is opening, open or closing: pulling the tab does nothing then. */
  engaged: SharedValue<boolean>;
  open: () => void;
};

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

/**
 * The AI lives above the tabs, like Revolut's. Pulling down from the top of
 * any tab grows a gradient from the notch and a "Swipe to ask AI" hint, with
 * a haptic tick once letting go will open it; only on release does the AI
 * take over the screen. Drag its header or its input up, flick it, or tap the
 * chevron to send it back.
 */
export function AiPanelProvider({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pull = useSharedValue(0);
  const engaged = useSharedValue(false);
  // 0 = closed, 1 = open.
  const progress = useSharedValue(0);
  // How far the open panel is being dragged by its header.
  const dragY = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const dragging = useSharedValue(false);
  const closing = useSharedValue(false);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    'worklet';
    engaged.set(true);
    pull.set(withTiming(0, { duration: 200, easing: EASE_OUT }));
    progress.set(withTiming(1, { duration: 320, easing: EASE_OUT }));
    scheduleOnRN(setIsOpen, true);
  }

  function close() {
    'worklet';
    closing.set(true);
    // Carry on upwards (from wherever a drag left it) while fading out.
    dragY.set(withTiming(Math.min(dragY.get(), 0) - height * 0.2, { duration: 240, easing: EASE_OUT }));
    progress.set(
      withTiming(0, { duration: 240, easing: EASE_OUT }, (finished) => {
        if (finished) {
          closing.set(false);
          engaged.set(false);
          dragY.set(0);
          scheduleOnRN(setIsOpen, false);
        }
      }),
    );
  }

  // A tick the moment the pull is far enough that letting go will open the AI.
  useAnimatedReaction(
    () => !engaged.get() && pull.get() >= OPEN_THRESHOLD,
    (armed, wasArmed) => {
      if (armed && !wasArmed) scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
    },
  );

  // ...and the same tick when you've dragged the AI far enough up that letting go will close it.
  useAnimatedReaction(
    () => dragging.get() && dragY.get() <= -CLOSE_THRESHOLD,
    (armed, wasArmed) => {
      if (armed && !wasArmed) scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
    },
  );

  // Dragging the panel up sends it back: far enough (past the tick), or a quick flick.
  function startDrag() {
    'worklet';
    dragging.set(true);
    dragStart.set(dragY.get());
  }
  function drag(e: { translationY: number }) {
    'worklet';
    const next = dragStart.get() + e.translationY;
    // Up follows the finger; down resists.
    dragY.set(next <= 0 ? next : rubberband(next, height));
  }
  function endDrag(e: { velocityY: number }) {
    'worklet';
    dragging.set(false);
    const projected = dragY.get() + project(e.velocityY);
    if (dragY.get() <= -CLOSE_THRESHOLD || projected < -height * 0.25) {
      close();
      scheduleOnRN(dismissKeyboard);
    } else {
      dragY.set(withSpring(0, { duration: 300, dampingRatio: 1, velocity: e.velocityY }));
    }
  }
  // By the header, either way.
  const headerGesture = usePanGesture({
    activeOffsetY: [-10, 10],
    onActivate: startDrag,
    onUpdate: drag,
    onDeactivate: endDrag,
  });
  // By the input, only upwards, so taps and typing still reach it.
  const composerGesture = usePanGesture({
    activeOffsetY: -10,
    failOffsetY: 10,
    onActivate: startDrag,
    onUpdate: drag,
    onDeactivate: endDrag,
  });

  // While pulling: a gradient grows down from the notch with the pull.
  const gradientStyle = useAnimatedStyle(() => ({
    height: insets.top + pull.get() * 1.4,
    opacity: interpolate(pull.get(), [0, OPEN_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  // ...and a hint fades in just below the notch, moving slower than the content (parallax).
  // It grows a little once letting go will open the AI.
  const hintStyle = useAnimatedStyle(() => {
    const armed = pull.get() >= OPEN_THRESHOLD;
    return {
      opacity: interpolate(pull.get(), [24, 80], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: pull.get() * 0.35 - 12 },
        { scale: withTiming(armed ? 1.06 : 1, { duration: 150, easing: EASE_OUT }) },
      ],
    };
  });

  // Open: the AI fades in and settles into place. Closed: hidden and inert.
  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { translateY: dragY.get() + interpolate(progress.get(), [0, 1], [-24, 0]) },
      { scale: interpolate(progress.get(), [0, 1], [0.98, 1]) },
    ],
  }));

  return (
    <AiPanelContext value={{ pull, engaged, open }}>
      <View style={styles.container}>
        {children}

        <Animated.View pointerEvents="none" style={[styles.gradient, gradientStyle]} />
        <Animated.View pointerEvents="none" style={[styles.hint, { top: insets.top + 6 }, hintStyle]}>
          <SymbolView name="sparkles" size={15} tintColor={Colors.olive} />
          <Text style={styles.hintText}>Swipe to ask AI</Text>
        </Animated.View>

        <Animated.View style={[styles.panel, panelStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <AiChat
            isOpen={isOpen}
            headerGesture={headerGesture}
            composerGesture={composerGesture}
            closing={closing}
            // Like letting go of a drag: the panel starts closing (and holds its layout
            // still) on the UI thread before the keyboard is told to go down.
            onClose={() =>
              scheduleOnUI(() => {
                close();
                scheduleOnRN(dismissKeyboard);
              })
            }
          />
        </Animated.View>
      </View>
    </AiPanelContext>
  );
}

/**
 * Gives a tab's scroll view the pull-down-for-AI gesture:
 * `<Animated.ScrollView onScroll={useAiPull()} scrollEventThrottle={16}>`.
 */
export function useAiPull() {
  const context = use(AiPanelContext);
  if (!context) throw new Error('useAiPull must be used inside AiPanelProvider');
  const { pull, engaged, open } = context;

  return useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!engaged.get()) pull.set(Math.max(0, -(e.contentOffset.y + e.contentInset.top)));
    },
    onEndDrag: (e) => {
      const distance = -(e.contentOffset.y + e.contentInset.top);
      if (!engaged.get() && distance >= OPEN_THRESHOLD) open();
    },
  });
}

// A plain function, so the UI thread can call it back without copying the Keyboard module.
function dismissKeyboard() {
  Keyboard.dismiss();
}

// Where the finger would come to rest if it kept decelerating (Apple's decay), from Expo's animation recipes.
function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// The further past the edge, the less the panel follows, from Expo's animation recipes.
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Unive's olive green (Colors.olive, the landing page's forest greens) at the notch, fading to nothing.
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(111, 118, 68, 0.4), rgba(111, 118, 68, 0))',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.text,
  },
  panel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
  },
});
