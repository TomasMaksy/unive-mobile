import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Shape, Spacing } from '@/constants/theme';
import { API_URL, authClient, signOut } from '@/lib/auth-client';

/** Opened from the avatar at the top left of every tab; swipe down to close. */
export default function ProfileScreen() {
  const { data: session } = authClient.useSession();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.grabber} />
      <ThemedText type="subtitle">Profile</ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{session?.user.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {session?.user.email}
        </ThemedText>
      </ThemedView>
      {__DEV__ && (
        <ThemedText type="small" themeColor="textMuted">
          Connected to {API_URL}
        </ThemedText>
      )}
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
    paddingTop: Spacing.three,
  },
  grabber: {
    ...Shape.pill,
    alignSelf: 'center',
    width: 36,
    height: 5,
    backgroundColor: Colors.border,
    marginBottom: Spacing.two,
  },
  card: {
    ...Shape.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
