import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { type Mentor, mentorImageUrl } from '@/lib/mentors';

const PHOTO_SIZE = 64;
const NAME_SIZE = 22;

type MentorCardProps = {
  mentor: Mentor;
  price: number;
  regularPrice: number;
  /** Its place in the list, so the cards come in one after another. */
  index: number;
  onBook: () => void;
};

/**
 * A tutor: photo, name, school, why they suit you, and booking. Tap the card
 * to read the whole bio; it grows in place.
 */
export function MentorCard({ mentor, price, regularPrice, index, onBook }: MentorCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(60 * index).duration(380)} layout={LinearTransition.springify().damping(18)}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityHint={expanded ? 'Shows less of the bio' : 'Shows the whole bio'}
        style={styles.card}>
        <View style={styles.header}>
          <Image source={{ uri: mentorImageUrl(mentor) }} style={styles.photo} transition={200} />
          <View style={styles.titles}>
            <ThemedText style={styles.name}>{mentor.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {mentor.university} · {mentor.major}
            </ThemedText>
          </View>
        </View>

        {mentor.why ? (
          <View style={styles.why}>
            <SymbolView name="sparkles" size={14} tintColor={Colors.olive} style={styles.whyIcon} />
            <ThemedText type="small" style={styles.whyText}>
              {mentor.why}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary" numberOfLines={expanded ? undefined : 3}>
          {mentor.description}
        </ThemedText>
        {!expanded && (
          <Animated.View entering={FadeIn}>
            <ThemedText type="smallBold" themeColor="olive">
              More
            </ThemedText>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <View style={styles.price}>
            {price < regularPrice ? (
              <ThemedText type="small" themeColor="textMuted" style={styles.strike}>
                ${regularPrice}
              </ThemedText>
            ) : null}
            <ThemedText type="smallBold">${price}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              / session
            </ThemedText>
          </View>
          {/* Its own press target inside the card (the card itself expands the bio). */}
          <PressableScale haptic pressedScale={0.94} onPress={onBook} accessibilityRole="button" style={styles.book}>
            <ThemedText type="smallBold" style={styles.bookLabel}>
              Book a session
            </ThemedText>
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: Colors.backgroundSelected,
  },
  titles: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: NAME_SIZE,
    lineHeight: NAME_SIZE * 1.2,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: NAME_SIZE * -0.03,
  },
  why: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three - Spacing.one,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(111, 118, 68, 0.08)',
  },
  whyIcon: {
    width: 14,
    height: 20,
  },
  whyText: {
    flex: 1,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  book: {
    ...Shape.pill,
    backgroundColor: Colors.olive,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingVertical: Spacing.three - Spacing.one,
  },
  bookLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
});
