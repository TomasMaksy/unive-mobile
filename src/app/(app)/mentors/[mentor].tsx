import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { PageTitle } from '@/components/page-title';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
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
          <Animated.View entering={FadeIn.duration(300)} style={styles.body}>
            <View style={styles.titles}>
              <PageTitle>{mentor.name}</PageTitle>
              <ThemedText themeColor="textSecondary" style={styles.school}>
                {mentor.university}
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {mentor.major}
              </ThemedText>
            </View>

            {mentor.why ? (
              <Animated.View entering={FadeInDown.delay(80)} style={styles.why}>
                <SymbolView name="sparkles" size={15} tintColor={Colors.olive} style={styles.whyIcon} />
                <ThemedText type="small" style={styles.whyText}>
                  {mentor.why}
                </ThemedText>
              </Animated.View>
            ) : null}

            <ThemedText style={styles.bio}>{mentor.description}</ThemedText>

            <View style={styles.guarantee}>
              <SymbolView name="checkmark.seal.fill" size={15} tintColor={Colors.olive} style={styles.whyIcon} />
              <ThemedText type="small" themeColor="textSecondary">
                60-minute video call. Not helpful? Full refund.
              </ThemedText>
            </View>
          </Animated.View>
        ) : (
          <ActivityIndicator style={styles.loading} color={Colors.textSecondary} />
        )}
      </ScrollView>

      <View style={[styles.close, { top: insets.top + Spacing.two }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      {mentor && mentors ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.bookBar, { bottom: insets.bottom + Spacing.two }]}>
          <PressableScale
            haptic
            pressedScale={0.96}
            onPress={() => void bookMentor(mentor, mentors.prefill)}
            accessibilityRole="button"
            style={styles.book}>
            <ThemedText style={styles.bookLabel}>Book a session</ThemedText>
            <ThemedText style={styles.bookPrice}>
              {mentors.price < mentors.regularPrice ? (
                <ThemedText style={[styles.bookPrice, styles.strike]}>${mentors.regularPrice} </ThemedText>
              ) : null}
              ${mentors.price}
            </ThemedText>
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  photo: {
    width: '100%',
    backgroundColor: Colors.backgroundSelected,
  },
  // The photo melts into the page instead of ending on a hard edge.
  photoFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 120,
    experimental_backgroundImage: `linear-gradient(0deg, ${Colors.background}, rgba(249, 249, 247, 0))`,
  },
  body: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    marginTop: -Spacing.four,
  },
  titles: {
    gap: Spacing.one,
  },
  school: {
    fontSize: 17,
  },
  why: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(111, 118, 68, 0.09)',
  },
  whyIcon: {
    width: 16,
    height: 20,
  },
  whyText: {
    flex: 1,
    color: Colors.text,
  },
  bio: {
    fontSize: 17,
    lineHeight: 27,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loading: {
    paddingTop: Spacing.five,
  },
  close: {
    position: 'absolute',
    left: Spacing.four,
  },
  bookBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  book: {
    ...Shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Colors.olive,
    boxShadow: '0 8px 24px rgba(111, 118, 68, 0.35)',
  },
  bookLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#ffffff',
  },
  bookPrice: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#ffffff',
  },
  strike: {
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'line-through',
    fontFamily: Fonts.sans,
  },
});
