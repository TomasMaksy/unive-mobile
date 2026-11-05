import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { PageTitle } from '@/components/page-title';
import { Loading, PressableScale, Text } from '@/components/ui';
import { alpha, colors, duration, easeUnive, pressScale, riseIn, shape, space } from '@/theme';
import { bookMentor, fetchMentors, findMentor, loadedMentors, type Mentors, mentorImageUrl } from '@/lib/mentors';

const BOOK_BAR_SPACE = 104;

/**
 * A mentor's full page: zooms open from their card, photo on top, then why
 * they suit you and their story, with Book always at the bottom.
 */
export default function MentorScreen() {
  const { mentor: slug } = useLocalSearchParams<{ mentor: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Usually already loaded by the list it was opened from.
  const [mentors, setMentors] = useState<Mentors | null>(loadedMentors);

  useEffect(() => {
    if (!loadedMentors()) fetchMentors().then(setMentors, () => {});
  }, []);

  const mentor = mentors ? findMentor(mentors, slug) : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: insets.bottom + BOOK_BAR_SPACE }}>
        {/* The card's photo grows into this one (Apple's zoom transition). */}
        <Link.AppleZoomTarget>
          <Image
            source={mentor ? { uri: mentorImageUrl(mentor) } : null}
            style={[styles.photo, { height: width }]}
            contentFit="cover"
          />
        </Link.AppleZoomTarget>
        <View pointerEvents="none" style={[styles.photoFade, { top: width - 120 }]} />

        {mentor && mentors ? (
          <Animated.View entering={FadeIn.duration(duration.standard).easing(easeUnive)} style={styles.body}>
            <View style={styles.titles}>
              <PageTitle>{mentor.name}</PageTitle>
              <Text color="textSecondary">{mentor.university}</Text>
              <Text variant="small" color="textMuted">
                {mentor.major}
              </Text>
            </View>

            {mentor.why ? (
              <Animated.View entering={riseIn(1)} style={styles.why}>
                <SymbolView name="sparkles" size={15} tintColor={colors.accent} style={styles.whyIcon} />
                <Text variant="small" style={styles.whyText}>
                  {mentor.why}
                </Text>
              </Animated.View>
            ) : null}

            <Text>{mentor.description}</Text>

            <View style={styles.guarantee}>
              <SymbolView name="checkmark.seal.fill" size={15} tintColor={colors.accent} style={styles.whyIcon} />
              <Text variant="small" color="textSecondary">
                60-minute video call. Not helpful? Full refund.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Loading fill={false} style={styles.loading} />
        )}
      </ScrollView>

      <View style={[styles.close, { top: insets.top + space[2] }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      {mentor && mentors ? (
        <Animated.View entering={riseIn(2)} style={[styles.bookBar, { bottom: insets.bottom + space[2] }]}>
          <PressableScale
            haptic
            pressedScale={pressScale.button}
            onPress={() => void bookMentor(mentor, mentors.prefill)}
            accessibilityRole="button"
            style={styles.book}>
            <Text variant="headline" color="textInverse">
              Book a session
            </Text>
            <Text variant="headline" color="textInverse">
              {mentors.price < mentors.regularPrice ? (
                <Text variant="headline" color="onInverseMuted" style={styles.strike}>
                  ${mentors.regularPrice}{' '}
                </Text>
              ) : null}
              ${mentors.price}
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photo: {
    width: '100%',
    backgroundColor: colors.fill,
  },
  // The photo melts into the page instead of ending on a hard edge.
  photoFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 120,
    experimental_backgroundImage: `linear-gradient(0deg, ${colors.background}, ${alpha('paper', 0)})`,
  },
  body: {
    paddingHorizontal: space[6],
    gap: space[6],
    marginTop: -space[6],
  },
  titles: {
    gap: space[1],
  },
  why: {
    flexDirection: 'row',
    gap: space[2],
    padding: space[4],
    ...shape.bubble,
    backgroundColor: alpha('meadow', 0.09),
  },
  whyIcon: {
    width: 16,
    height: 20,
  },
  whyText: {
    flex: 1,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  loading: {
    paddingTop: space[8],
  },
  close: {
    position: 'absolute',
    left: space[6],
  },
  bookBar: {
    position: 'absolute',
    left: space[4],
    right: space[4],
  },
  book: {
    ...shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
    paddingVertical: space[4],
    backgroundColor: colors.accent,
    boxShadow: `0 8px 24px ${alpha('meadow', 0.35)}`,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
});
