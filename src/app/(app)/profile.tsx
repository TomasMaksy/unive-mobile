import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ProfileList } from '@/components/profile-list';
import { colors, space } from '@/theme';
import { authClient, signOut } from '@/lib/auth-client';
import { useEditProfilePhoto } from '@/lib/use-edit-profile-photo';

/**
 * Zooms out of the avatar at the top left of every tab (see screen-header.tsx).
 * It has no navigation header, so the whole screen zooms as one piece; this
 * close button (or swiping down or from the left edge) zooms it back.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  // unive-v2 keeps the last name in its own field (lastName, see src/lib/auth/server.ts there).
  const lastName = (session?.user as { lastName?: string | null } | undefined)?.lastName;
  const fullName = [session?.user.name, lastName].filter(Boolean).join(' ');
  const { imageUrl, uploading: uploadingPhoto, editPhoto } = useEditProfilePhoto();

  return (
    <View style={[{ backgroundColor: colors.background }, styles.container]}>
      <ProfileList
        name={fullName}
        email={session?.user.email ?? ''}
        imageUrl={imageUrl}
        uploadingPhoto={uploadingPhoto}
        onEditPhoto={editPhoto}
        onInvite={() => router.push('/invite')}
        onOpen={(screen) => router.push(`/${screen}`)}
        onSignOut={signOut}
      />
      <View style={[styles.close, { top: insets.top + space[2] }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Same spot and size as the avatar it zoomed out of (see screen-header.tsx).
  close: {
    position: 'absolute',
    left: space[6],
  },
});
