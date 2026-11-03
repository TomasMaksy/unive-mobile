import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shape, Spacing } from '@/constants/theme';

export type ProfileListProps = {
  name: string;
  email: string;
  /** Shown in development only: the backend the app talks to. */
  backend?: string;
  onSignOut: () => void;
};

/**
 * Android and web fallback. On iOS, profile-list.ios.tsx renders a native
 * SwiftUI grouped list instead.
 */
export function ProfileList({ name, email, backend, onSignOut }: ProfileListProps) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <ThemedText type="smallBold">{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {email}
        </ThemedText>
      </View>
      {backend ? (
        <ThemedText type="small" themeColor="textMuted">
          Connected to {backend}
        </ThemedText>
      ) : null}
      <Button label="Sign out" variant="secondary" onPress={onSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  card: {
    ...Shape.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
