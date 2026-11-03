import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

type ScreenHeaderProps = {
  title: string;
  /** Shown on the right of the avatar row, e.g. a button. */
  right?: ReactNode;
};

/** The top of every tab: your avatar on the left (opens the profile, like Revolut), then the title. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Avatar />
        {right}
      </View>
      <ThemedText type="subtitle">{title}</ThemedText>
    </View>
  );
}

function Avatar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      hitSlop={8}
      onPress={() => router.push('/profile')}
      style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
      {user?.image ? (
        <Image source={user.image} style={styles.image} />
      ) : (
        <Text style={styles.initial}>{initial}</Text>
      )}
    </Pressable>
  );
}

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: AVATAR_SIZE,
  },
  avatar: {
    ...Shape.pill,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSelected,
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  initial: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.text,
  },
});
