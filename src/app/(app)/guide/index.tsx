import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { fetchGuideTopics, type GuideTopicSummary, siteUrl } from '@/lib/guide';

const GAP = 12;
const TITLE_SIZE = 19;

/** The Application Guide's topics, like the website's /dashboard/guide. Opened from the profile. */
export default function GuideScreen() {
  const { width } = useWindowDimensions();
  const [topics, setTopics] = useState<GuideTopicSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const cardWidth = (width - Spacing.three * 2 - GAP) / 2;

  useEffect(() => {
    fetchGuideTopics().then(setTopics, () => setFailed(true));
  }, []);

  function retry() {
    setFailed(false);
    fetchGuideTopics().then(setTopics, () => setFailed(true));
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PageTitle>Application Guide</PageTitle>
        <ThemedText themeColor="textSecondary">Your step-by-step application course.</ThemedText>
      </View>

      {topics ? (
        <View style={styles.grid}>
          {topics.map((topic, index) => (
            <TopicCard key={topic.id} topic={topic} index={index} width={cardWidth} />
          ))}
        </View>
      ) : failed ? (
        <Pressable onPress={retry} style={styles.status}>
          <ThemedText themeColor="textSecondary">Couldn’t load the guide.</ThemedText>
          <ThemedText themeColor="olive">Try again</ThemedText>
        </Pressable>
      ) : (
        <ActivityIndicator style={styles.status} color={Colors.textSecondary} />
      )}
    </ScrollView>
  );
}

// A topic: its illustration (whole, never cropped), the title, and how long it is.
// Tap it and it zooms open, like a story on the App Store's Today tab.
function TopicCard({ topic, index, width }: { topic: GuideTopicSummary; index: number; width: number }) {
  const meta = [`${topic.sections.length} sections`, topic.readingMinutes ? `${topic.readingMinutes} min` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View entering={FadeInDown.delay(50 * index).duration(380)} style={{ width }}>
      <Link href={{ pathname: '/guide/[topic]', params: { topic: topic.id, image: topic.imagePath } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={0.96} haptic accessibilityRole="button" accessibilityLabel={topic.title} style={styles.card}>
            {/* The illustrations are cut-outs of different shapes; each fits whole. */}
            <Image source={{ uri: siteUrl(topic.imagePath) }} style={styles.art} contentFit="contain" transition={250} />
            <View style={styles.text}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {topic.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                {meta}
              </ThemedText>
            </View>
          </PressableScale>
        </Link.Trigger>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    paddingHorizontal: Spacing.one,
    gap: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    overflow: 'hidden',
  },
  art: {
    height: 150,
    marginTop: Spacing.three,
    marginHorizontal: Spacing.three,
  },
  text: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.2,
    // Two lines' room, so cards side by side end at the same height.
    minHeight: TITLE_SIZE * 1.2 * 2,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: TITLE_SIZE * -0.03,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
