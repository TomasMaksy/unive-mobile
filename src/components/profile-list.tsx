import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PROFILE_LINKS, type ProfileScreen } from '@/components/profile-links';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shape, Spacing } from '@/constants/theme';

export type ProfileListProps = {
  name: string;
  email: string;
  /** Your profile picture, or null for your initial. */
  imageUrl: string | null;
  /** A new picture is uploading. */
  uploadingPhoto: boolean;
  /** Tapping your picture: take, choose or remove one. */
  onEditPhoto: () => void;
  onInvite: () => void;
  onOpen: (screen: ProfileScreen) => void;
  onSignOut: () => void;
};

/**
 * Android and web fallback. On iOS, profile-list.ios.tsx renders a native
 * SwiftUI grouped list instead.
 */
export function ProfileList({
  name,
  email,
  imageUrl,
  uploadingPhoto,
  onEditPhoto,
  onInvite,
  onOpen,
  onSignOut,
}: ProfileListProps) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Change profile picture" onPress={onEditPhoto}>
          <ProfileAvatar size={104} imageUrl={imageUrl} name={name || email} busy={uploadingPhoto} />
        </PressableScale>
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
