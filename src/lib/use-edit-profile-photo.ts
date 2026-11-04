import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { removeProfileImage, uploadProfileImage, useProfileImage } from '@/lib/profile-image';

/**
 * Changing your profile picture, from the profile or Settings: the system's
 * action sheet (Take Photo, Choose Photo, Remove Photo), like Contacts.
 */
export function useEditProfilePhoto() {
  const imageUrl = useProfileImage();
  const [uploading, setUploading] = useState(false);

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
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setUploading(true);
    try {
      await uploadProfileImage(asset.uri, asset.mimeType);
    } catch (error) {
      Alert.alert("Couldn't change your picture", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      await removeProfileImage();
    } catch {
      Alert.alert("Couldn't remove your picture", 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function editPhoto() {
    if (uploading) return;
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

  return { imageUrl, uploading, editPhoto };
}
