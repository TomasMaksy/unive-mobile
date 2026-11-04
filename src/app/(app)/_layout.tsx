import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

// No navigation bar: the page scrolls up under the status bar and a floating
// back button (glass on iOS 26), and shows its own title in the content.
const linkedScreen = {
  headerShown: true,
  headerTransparent: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerBackTitle: 'Profile',
  headerTintColor: Colors.text,
  contentStyle: { backgroundColor: Colors.backgroundGrouped },
} as const;

/** Signed in: the tabs, with the profile zooming out of the avatar on top of them. */
export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(tabs)" />
      {/* A full-screen push, so Apple's zoom transition can run (it doesn't work with sheets).
          No navigation header: it would stay put while the screen zooms underneath it.
          The screen has its own close button instead. */}
      <Stack.Screen name="profile" />
      {/* Give & get: full screen, with its own close button over the gift scene. */}
      <Stack.Screen name="invite" />
      {/* Opened from the profile: ordinary pushes, no navigation bar (see linkedScreen). */}
      <Stack.Screen name="knowledge" options={linkedScreen} />
      <Stack.Screen name="guide/index" options={linkedScreen} />
      {/* Zooms open from its card (Apple's zoom transition), so no navigation header
          (it would stay put while the page zooms); the page has its own close button. */}
      <Stack.Screen name="guide/[topic]" />
      <Stack.Screen name="mentors/index" options={linkedScreen} />
      {/* Zooms open from the mentor's card, with its own close button (see guide/[topic]). */}
      <Stack.Screen name="mentors/[mentor]" />
      <Stack.Screen name="settings" options={linkedScreen} />
    </Stack>
  );
}
