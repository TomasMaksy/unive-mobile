import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { useProfileImage } from '@/lib/profile-image';

type ScreenHeaderProps = {
  /** Leave out for just the button row, e.g. in the AI chat. */
  title?: string;
  /** Replaces the avatar on the left, e.g. a close button. */
  left?: ReactNode;
  /** Shown on the right of the avatar row, e.g. a button. */
  right?: ReactNode;
};

/** The top of every tab: your avatar on the left (opens the profile, like Revolut), then the title. */
export function ScreenHeader({ title, left, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {left ?? <Avatar />}
        {right}
      </View>
      {title && <ThemedText type="subtitle">{title}</ThemedText>}
    </View>
  );
}

// Like Revolut: the profile zooms out of the avatar to fill the screen
// (Apple's zoom transition, iOS 18+), and pinch or swipe down zooms it back.
function Avatar() {
  const { data: session } = authClient.useSession();
  const imageUrl = useProfileImage();

  return (
    <Link href="/profile" asChild>
      <Link.Trigger withAppleZoom>
        <PressableScale accessibilityRole="button" accessibilityLabel="Profile" pressedScale={0.9} haptic>
          <ProfileAvatar size={AVATAR_SIZE} imageUrl={imageUrl} name={session?.user.name || session?.user.email || ''} />
        </PressableScale>
      </Link.Trigger>
    </Link>
  );
}

const AVATAR_SIZE = 44;

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
});
