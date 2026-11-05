import * as Haptics from 'expo-haptics';

/**
 * The app's haptic vocabulary. Use these instead of calling expo-haptics
 * directly, so the same moment always feels the same. The light tap on
 * touch-down is iOS only: on Android's motors it feels cheap.
 */
const ios = process.env.EXPO_OS === 'ios';

export const haptics = {
  /** A finger lands on a button. */
  tap: () => ios && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** Something snapped: a pull crossed its threshold, a drag hit a stop. */
  tick: () => void Haptics.selectionAsync(),
  /** A heavier thing lands: a sheet, a long-press menu. */
  thud: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** It worked: saved, sent, signed in. */
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Look again: a wrong code, a failed upload. */
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
