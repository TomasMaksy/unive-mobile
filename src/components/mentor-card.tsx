import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { type Mentor, mentorImageUrl, mentorSlug } from '@/lib/mentors';

const PHOTO_SIZE = 60;
const NAME_SIZE = 20;

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
    <Animated.View entering={FadeInDown.delay(50 * index).duration(380)}>
      <Link href={{ pathname: '/mentors/[mentor]', params: { mentor: mentorSlug(mentor) } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={0.97} accessibilityRole="button" accessibilityLabel={mentor.name} style={styles.card}>
            <Image source={{ uri: mentorImageUrl(mentor) }} style={styles.photo} transition={200} />
            <View style={styles.text}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {mentor.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {mentor.university}
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted" numberOfLines={1} style={styles.meta}>
                ${price} / session
              </ThemedText>
            </View>
            {/* Its own press target inside the card (the card opens the mentor's page). */}
            <PressableScale haptic pressedScale={0.92} onPress={onBook} accessibilityRole="button" accessibilityLabel={`Book a session with ${mentor.name}`} style={styles.book}>
              <ThemedText style={styles.bookLabel}>Book</ThemedText>
            </PressableScale>
          </PressableScale>
        </Link.Trigger>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: Colors.backgroundElement,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: Colors.backgroundSelected,
  },
  text: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: NAME_SIZE,
    lineHeight: NAME_SIZE * 1.25,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: NAME_SIZE * -0.03,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.half,
  },
  book: {
    ...Shape.pill,
    backgroundColor: Colors.olive,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bookLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#ffffff',
  },
});
