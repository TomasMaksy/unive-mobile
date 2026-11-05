import '@/polyfills';

import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Loading } from '@/components/ui';
import { colors, fontFiles } from '@/theme';
import { authClient } from '@/lib/auth-client';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.text,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  const { data: session, isPending } = authClient.useSession();

  // Keep the native splash screen up until text can render in the brand fonts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <AnimatedSplashOverlay />
        {isPending ? (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Loading />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!!session}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!session}>
              <Stack.Screen name="sign-in" />
            </Stack.Protected>
            {/* The design system gallery (DESIGN.md): development builds only, signed in or not. */}
            <Stack.Screen name="design" />
          </Stack>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
