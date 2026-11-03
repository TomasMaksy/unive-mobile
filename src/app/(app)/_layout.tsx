import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** Signed in: the tabs, with the profile zooming out of the avatar on top of them. */
export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(tabs)" />
      {/* A full-screen push, so Apple's zoom transition can run (it doesn't work with sheets).
          No navigation header: it would stay put while the screen zooms underneath it.
          The screen has its own close button instead. */}
      <Stack.Screen name="profile" />
    </Stack>
  );
}
