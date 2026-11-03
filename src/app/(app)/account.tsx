import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Shape, Spacing } from '@/constants/theme';
import { API_URL, authClient, signOutOnDevice } from '@/lib/auth-client';

export default function AccountScreen() {
  const { data: session } = authClient.useSession();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="subtitle">Account</ThemedText>
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
        <Button label="Sign out" variant="secondary" onPress={signOutOnDevice} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  card: {
    ...Shape.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
