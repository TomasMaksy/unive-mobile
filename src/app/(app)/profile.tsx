import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ProfileList } from '@/components/profile-list';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { authClient, signOut } from '@/lib/auth-client';
import { removeProfileImage, uploadProfileImage, useProfileImage } from '@/lib/profile-image';
import { fetchReferralInvite, type ReferralInvite } from '@/lib/referral';

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
  const imageUrl = useProfileImage();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [invite, setInvite] = useState<ReferralInvite | null>(null);

  // Load the invite link now, so the share sheet opens the moment you tap.
  useEffect(() => {
    fetchReferralInvite()
      .then(setInvite)
      .catch(() => {}); // Tapping tries again.
  }, []);

  async function shareInvite() {
    try {
      const { inviteUrl } = invite ?? (await fetchReferralInvite());
      // The link goes inside the message: passed separately, iOS's Copy would copy only the text.
      // Messages and other apps still turn it into a preview card.
      await Share.share({ message: `Join me on Unive and we both get a month free: ${inviteUrl}` });
    } catch {
      Alert.alert("Couldn't load your invite link", 'Check your connection and try again.');
    }
  }

  async function pickPhoto(source: 'camera' | 'library') {
    // Apple's own square crop, like the website's crop dialog.
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
      Alert.alert('No camera access', 'Allow Unive to use the camera in Settings to take a picture.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setUploadingPhoto(true);
    try {
      await uploadProfileImage(asset.uri, asset.mimeType);
    } catch (error) {
      Alert.alert("Couldn't change your picture", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function removePhoto() {
    setUploadingPhoto(true);
    try {
      await removeProfileImage();
    } catch {
      Alert.alert("Couldn't remove your picture", 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  // The system's action sheet, like changing your photo in Contacts.
  function editPhoto() {
    if (uploadingPhoto) return;
    const actions = [
      { title: 'Take Photo', run: () => pickPhoto('camera') },
      { title: 'Choose Photo', run: () => pickPhoto('library') },
      ...(imageUrl ? [{ title: 'Remove Photo', run: removePhoto, destructive: true }] : []),
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...actions.map((a) => a.title), 'Cancel'],
          cancelButtonIndex: actions.length,
          destructiveButtonIndex: imageUrl ? actions.length - 1 : undefined,
        },
        (index) => actions[index]?.run(),
      );
    } else {
      Alert.alert('Profile picture', undefined, [
        ...actions.map((a) => ({ text: a.title, onPress: a.run, style: a.destructive ? ('destructive' as const) : undefined })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ProfileList
        name={fullName}
        email={session?.user.email ?? ''}
        imageUrl={imageUrl}
        uploadingPhoto={uploadingPhoto}
        onEditPhoto={editPhoto}
        onInvite={shareInvite}
        onOpen={(screen) => router.push(`/${screen}`)}
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
  // Same spot and size as the avatar it zoomed out of (see screen-header.tsx).
  close: {
    position: 'absolute',
    left: Spacing.four,
  },
});
