import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ProfileList } from '@/components/profile-list';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { API_URL, authClient, signOut } from '@/lib/auth-client';

/**
 * Zooms out of the avatar at the top left of every tab (see screen-header.tsx).
 * It has no navigation header, so the whole screen zooms as one piece; this
 * close button (or swiping down or from the left edge) zooms it back.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();

  return (
    <ThemedView style={styles.container}>
      <ProfileList
        name={session?.user.name ?? ''}
        email={session?.user.email ?? ''}
        backend={__DEV__ ? API_URL : undefined}
        onSignOut={signOut}
      />
      <View style={[styles.close, { top: insets.top + Spacing.two }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    left: Spacing.three,
  },
});
