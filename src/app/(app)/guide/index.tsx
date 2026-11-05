import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { ErrorState, PressableScale, Skeleton, Text } from '@/components/ui';
import { colors, pressScale, riseIn, shadow, shape, space } from '@/theme';
import { fetchGuideTopics, type GuideTopicSummary, siteUrl } from '@/lib/guide';

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
        <Text color="textSecondary">Your step-by-step application course.</Text>
      </View>

      {topics ? (
        <View style={styles.list}>
          {topics.map((topic, index) => (
            <TopicCard key={topic.id} topic={topic} index={index} />
          ))}
        </View>
      ) : failed ? (
        <ErrorState message="Couldn’t load the guide." onRetry={retry} fill={false} />
      ) : (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} shape="block" height={ART_SIZE + space[8]} />
          ))}
        </View>
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
    <Animated.View entering={riseIn(index)}>
      <Link href={{ pathname: '/guide/[topic]', params: { topic: topic.id, image: topic.imagePath } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={pressScale.card} haptic accessibilityRole="button" accessibilityLabel={topic.title} style={styles.card}>
            <View style={styles.text}>
              <Text variant="title" numberOfLines={2}>
                {topic.title}
              </Text>
              <Text variant="small" color="textSecondary">
                {meta}
              </Text>
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
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[6],
  },
  header: {
    paddingHorizontal: space[1],
    gap: space[1],
  },
  list: {
    gap: space[3],
  },
  card: {
    ...shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingVertical: space[4],
    paddingLeft: space[6],
    paddingRight: space[4],
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  text: {
    flex: 1,
    gap: space[2],
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
  },
});
