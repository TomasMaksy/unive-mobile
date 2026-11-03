import { Image } from 'expo-image';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
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

// Like Revolut: the profile zooms out of the avatar to fill the screen
// (Apple's zoom transition, iOS 18+), and pinch or swipe down zooms it back.
function Avatar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <Link href="/profile" asChild>
      <Link.Trigger withAppleZoom>
        <PressableScale accessibilityRole="button" accessibilityLabel="Profile" pressedScale={0.9} haptic>
          <View style={styles.avatar}>
            {user?.image ? (
              <Image source={user.image} style={styles.image} />
            ) : (
              <Text style={styles.initial}>{initial}</Text>
            )}
          </View>
        </PressableScale>
      </Link.Trigger>
    </Link>
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
