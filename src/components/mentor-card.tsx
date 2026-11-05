import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button, PressableScale, Text } from '@/components/ui';
import { colors, pressScale, riseIn, shadow, shape, space } from '@/theme';
import { type Mentor, mentorImageUrl, mentorSlug } from '@/lib/mentors';

const PHOTO_SIZE = 60;

type MentorCardProps = {
  mentor: Mentor;
  price: number;
  /** Its place in the list, so the cards come in one after another. */
  index: number;
  onBook: () => void;
};

/**
 * A tutor in one compact row: photo, name, school, price, and Book. Tap the
 * card for their full page, which zooms open from the photo.
 */
export function MentorCard({ mentor, price, index, onBook }: MentorCardProps) {
  return (
    <Animated.View entering={riseIn(index)}>
      <Link href={{ pathname: '/mentors/[mentor]', params: { mentor: mentorSlug(mentor) } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={pressScale.card} accessibilityRole="button" accessibilityLabel={mentor.name} style={styles.card}>
            <Image source={{ uri: mentorImageUrl(mentor) }} style={styles.photo} transition={200} />
            <View style={styles.text}>
              <Text variant="title" numberOfLines={1}>
                {mentor.name}
              </Text>
              <Text variant="small" color="textSecondary" numberOfLines={1}>
                {mentor.university}
              </Text>
              <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.meta}>
                ${price} / session
              </Text>
            </View>
            {/* Its own press target inside the card (the card opens the mentor's page). */}
            <Button label="Book" variant="accent" size="sm" inline onPress={onBook} style={styles.book} />
          </PressableScale>
        </Link.Trigger>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[4],
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: colors.fill,
  },
  text: {
    flex: 1,
  },
  meta: {
    marginTop: space[0.5],
  },
  book: {
    alignSelf: 'center',
  },
});
