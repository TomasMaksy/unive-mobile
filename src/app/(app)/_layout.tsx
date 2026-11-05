import { Stack } from 'expo-router';

import { colors } from '@/theme';

// No navigation bar: the page scrolls up under the status bar and a floating
// back button (glass on iOS 26), and shows its own title in the content.
const linkedScreen = {
  headerShown: true,
  headerTransparent: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerBackTitle: 'Profile',
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.backgroundGrouped },
} as const;

/** Signed in: the tabs, with the profile zooming out of the avatar on top of them. */
export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      {/* A full-screen push, so Apple's zoom transition can run (it doesn't work with sheets).
          No navigation header: it would stay put while the screen zooms underneath it.
          The screen has its own close button instead. */}
      <Stack.Screen name="profile" />
      {/* Give & get: full screen, with its own close button over the gift scene. */}
      <Stack.Screen name="invite" />
      {/* Opened from the profile: ordinary pushes, no navigation bar (see linkedScreen). */}
      <Stack.Screen name="knowledge/index" options={linkedScreen} />
      {/* About you, each section (Activities…) and each item: ordinary pushes.
          An item's page edits in place (Edit, then Done), like a contact card. */}
      <Stack.Screen name="knowledge/about" options={linkedScreen} />
      <Stack.Screen name="knowledge/[kind]/index" options={linkedScreen} />
      <Stack.Screen name="knowledge/[kind]/item" options={linkedScreen} />
      {/* Choosing a school, place or study interest, with a search field. */}
      <Stack.Screen name="knowledge/pick" options={linkedScreen} />
      {/* Your stage of education: high school or college, then which year. */}
      <Stack.Screen name="knowledge/stage" options={linkedScreen} />
      {/* Adding documents for Unive to read (the website's Dropzone). */}
      <Stack.Screen name="knowledge/dropzone" options={{ ...linkedScreen, headerBackTitle: 'Library' }} />
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
