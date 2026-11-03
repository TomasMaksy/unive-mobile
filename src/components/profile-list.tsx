import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { PROFILE_LINKS, type ProfileScreen } from '@/components/profile-links';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shape, Spacing } from '@/constants/theme';

export type ProfileListProps = {
  name: string;
  email: string;
  /** Shown in development only: the backend the app talks to. */
  backend?: string;
  onInvite: () => void;
  onOpen: (screen: ProfileScreen) => void;
  onSignOut: () => void;
};

/**
 * Android and web fallback. On iOS, profile-list.ios.tsx renders a native
 * SwiftUI grouped list instead.
 */
export function ProfileList({ name, email, backend, onInvite, onOpen, onSignOut }: ProfileListProps) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {email}
        </ThemedText>
      </View>
      <View style={styles.card}>
        <Pressable style={styles.row} onPress={onInvite}>
          <ThemedText>Invite friends</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Earn $150+
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.card}>
        {PROFILE_LINKS.map((link) => (
          <Pressable key={link.screen} style={styles.row} onPress={() => onOpen(link.screen)}>
            <ThemedText>{link.title}</ThemedText>
          </Pressable>
        ))}
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
    paddingTop: Spacing.five,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    paddingHorizontal: Spacing.three,
  },
  row: {
    paddingVertical: Spacing.three,
    gap: 2,
  },
});
