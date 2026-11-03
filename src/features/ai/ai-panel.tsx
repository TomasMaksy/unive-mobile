import * as Haptics from 'expo-haptics';
import { createContext, use, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';
import { AiChat } from '@/features/ai/ai-chat';

/** How far past the top you pull before letting go opens the AI. */
const OPEN_THRESHOLD = 110;

type AiPanelContextValue = {
  /** How far the current tab is pulled down past its top, in points. */
  pull: SharedValue<number>;
  /** True while the panel is opening, open or closing: the pull no longer moves it. */
  engaged: SharedValue<boolean>;
  open: (fromY: number) => void;
  height: number;
};

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

/**
 * The AI lives above the tabs, like Revolut's: pull down from the top of any
 * tab and it comes down after your finger, with a haptic tick once letting go
 * will open it. Drag its header up, flick it, or tap the chevron to send it back.
 */
export function AiPanelProvider({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  const pull = useSharedValue(0);
  const engaged = useSharedValue(false);
  // The panel's position once engaged: 0 is fully down, -height is hidden above the screen.
  const y = useSharedValue(-height);
  const dragStart = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  function open(fromY: number) {
    'worklet';
    engaged.set(true);
    pull.set(0);
    y.set(fromY);
    y.set(withSpring(0, { duration: 450, dampingRatio: 0.85 }));
    scheduleOnRN(setIsOpen, true);
  }

  function close(velocity = 0) {
    'worklet';
    y.set(
      withSpring(-height, { duration: 350, dampingRatio: 1, velocity, overshootClamping: true }, (finished) => {
        if (finished) {
          engaged.set(false);
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

  // Dragging the header up sends the panel back; a quick flick is enough (velocity decides, not distance).
  const headerGesture = usePanGesture({
    activeOffsetY: [-10, 10],
    onActivate: () => {
      dragStart.set(y.get());
    },
    onUpdate: (e) => {
      const next = dragStart.get() + e.translationY;
      // Up is free; pulling further down resists.
      y.set(next <= 0 ? next : rubberband(next, height));
    },
    onDeactivate: (e) => {
      const projected = y.get() + project(e.velocityY);
      if (projected < -height * 0.3) {
        close(e.velocityY);
        scheduleOnRN(dismissKeyboard);
      } else {
        y.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }));
      }
    },
  });

  const panelStyle = useAnimatedStyle(() => ({
    // While you pull, the panel's bottom edge travels with the top of the content.
    transform: [{ translateY: engaged.get() ? y.get() : -height + pull.get() }],
  }));

  return (
    <AiPanelContext value={{ pull, engaged, open, height }}>
      <View style={styles.container}>
        {children}
        <Animated.View style={[styles.panel, panelStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <AiChat
            headerGesture={headerGesture}
            onClose={() => {
              Keyboard.dismiss();
              close();
            }}
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
  const { pull, engaged, open, height } = context;

  return useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!engaged.get()) pull.set(Math.max(0, -(e.contentOffset.y + e.contentInset.top)));
    },
    onEndDrag: (e) => {
      const distance = -(e.contentOffset.y + e.contentInset.top);
      if (!engaged.get() && distance >= OPEN_THRESHOLD) open(-height + distance);
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
  panel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    // Rounded bottom corners while it hangs from the top; at rest they meet the screen's own.
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    borderCurve: 'continuous',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
});
