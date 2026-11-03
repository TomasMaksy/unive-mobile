import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** Signed in: the tabs, with the profile sliding up over them as a sheet. */
export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
