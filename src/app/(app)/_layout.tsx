import { Stack } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';

/** Signed in: the tabs, with the profile zooming out of the avatar on top of them. */
export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="profile"
        options={{
          // A full-screen push, so Apple's zoom transition can run (it doesn't work with sheets).
          // The header gives it a back button: Apple's zoom gestures alone aren't discoverable.
          headerShown: true,
          title: 'Profile',
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { fontFamily: Fonts.sansSemiBold },
        }}
      />
    </Stack>
  );
}
