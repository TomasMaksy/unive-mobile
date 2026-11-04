import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Shape } from '@/constants/theme';
import { profileImageCacheKey } from '@/lib/profile-image';

type ProfileAvatarProps = {
  size: number;
  /** Your profile picture (see useProfileImage), or null for your initial. */
  imageUrl: string | null;
  name: string;
  /** A new picture is uploading. */
  busy?: boolean;
};

/** Your picture in a circle, or your initial when you haven't added one. */
export function ProfileAvatar({ size, imageUrl, name, busy }: ProfileAvatarProps) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl, cacheKey: profileImageCacheKey(imageUrl) }}
          style={StyleSheet.absoluteFill}
          transition={150}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      )}
      {busy && (
        <View style={[StyleSheet.absoluteFill, styles.busy]}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    ...Shape.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSelected,
  },
  initial: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.text,
  },
  busy: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
