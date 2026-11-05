import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PROFILE_LINKS, type ProfileScreen } from '@/components/profile-links';
import { Text } from '@/components/ui/text';
import { colors, shape, space } from '@/theme';

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
        <Text variant="h3">{name}</Text>
        <Text variant="small" color="textSecondary">
          {email}
        </Text>
      </View>
      <View style={styles.card}>
        <Pressable style={styles.row} onPress={onInvite}>
          <Text>Invite friends</Text>
          <Text variant="small" color="textSecondary">
            Earn $150+
          </Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {PROFILE_LINKS.map((link) => (
          <Pressable key={link.screen} style={styles.row} onPress={() => onOpen(link.screen)}>
            <Text>{link.title}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Sign out" variant="secondary" onPress={onSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    padding: space[6],
    paddingTop: space[8],
  },
  header: {
    alignItems: 'center',
    gap: space[1],
  },
  card: {
    ...shape.card,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
  },
  row: {
    paddingVertical: space[4],
    gap: 2,
  },
});
