import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Loader, Text } from '@/components/ui';
import { colors, shape } from '@/theme';
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
        // The initial scales with the circle, so its size can't be a step of the type scale.
        // eslint-disable-next-line no-restricted-syntax
        <Text variant="headline" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
          {initial}
        </Text>
      )}
      {busy && (
        <View style={[StyleSheet.absoluteFill, styles.busy]}>
          <Loader size={Math.round(size * 0.22)} color={colors.textInverse} accessibilityLabel="Uploading" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    ...shape.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // See-through, so the circle shows on paper and on mist pages (Settings) alike.
    backgroundColor: colors.track,
  },
  busy: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
});
