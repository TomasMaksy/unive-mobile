import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

const linkedScreen = {
  headerShown: true,
  headerLargeTitle: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBackTitle: 'Profile',
  headerTintColor: Colors.text,
  headerStyle: { backgroundColor: Colors.background },
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
      {/* Opened from the profile: ordinary pushes with a large native title and a back button. */}
      <Stack.Screen name="knowledge" options={{ ...linkedScreen, title: 'Knowledge Library' }} />
      <Stack.Screen name="guide" options={{ ...linkedScreen, title: 'Application Guide' }} />
      <Stack.Screen name="mentors" options={{ ...linkedScreen, title: 'Mentors' }} />
      <Stack.Screen name="settings" options={{ ...linkedScreen, title: 'Settings' }} />
    </Stack>
  );
}
