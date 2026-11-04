import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { fetchGuideTopics, type GuideTopicSummary, siteUrl } from '@/lib/guide';

const TITLE_SIZE = 24;
const ART_SIZE = 96;

/** The Application Guide's topics, like the website's /dashboard/guide. Opened from the profile. */
export default function GuideScreen() {
  const [topics, setTopics] = useState<GuideTopicSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

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
        <View style={styles.list}>
          {topics.map((topic, index) => (
            <TopicCard key={topic.id} topic={topic} index={index} />
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

// A topic in one row: the title and how long it is on the left, its
// illustration (whole, never cropped) on the right.
// Tap it and it zooms open, like a story on the App Store's Today tab.
function TopicCard({ topic, index }: { topic: GuideTopicSummary; index: number }) {
  const meta = [`${topic.sections.length} sections`, topic.readingMinutes ? `${topic.readingMinutes} min` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View entering={FadeInDown.delay(50 * index).duration(380)}>
      <Link href={{ pathname: '/guide/[topic]', params: { topic: topic.id, image: topic.imagePath } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={0.96} haptic accessibilityRole="button" accessibilityLabel={topic.title} style={styles.card}>
            <View style={styles.text}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {topic.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                {meta}
              </ThemedText>
            </View>
            {/* The illustrations are cut-outs of different shapes; each fits whole. */}
            <Image source={{ uri: siteUrl(topic.imagePath) }} style={styles.art} contentFit="contain" transition={250} />
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
  list: {
    gap: Spacing.two + Spacing.one,
  },
  card: {
    ...Shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.three,
    backgroundColor: Colors.backgroundElement,
  },
  text: {
    flex: 1,
    gap: Spacing.two,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.15,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: TITLE_SIZE * -0.03,
  },
  meta: {
    fontSize: 14,
    lineHeight: 19,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
