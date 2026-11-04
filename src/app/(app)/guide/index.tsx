import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { fetchGuideTopics, type GuideTopicSummary, siteUrl } from '@/lib/guide';

const TITLE_SIZE = 24;

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
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Your step-by-step application course.
      </ThemedText>

      {topics ? (
        topics.map((topic, index) => <TopicCard key={topic.id} topic={topic} index={index} />)
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

// A topic, like a story on the App Store's Today tab: tap it and it zooms open.
function TopicCard({ topic, index }: { topic: GuideTopicSummary; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(70 * index).duration(400)}>
      <Link href={{ pathname: '/guide/[topic]', params: { topic: topic.id, image: topic.imagePath } }} asChild>
        <Link.Trigger withAppleZoom>
          <PressableScale pressedScale={0.97} haptic accessibilityRole="button" style={styles.card}>
            <Image source={{ uri: siteUrl(topic.imagePath) }} style={styles.image} contentFit="cover" transition={250} />
            <View style={styles.body}>
              <ThemedText type="smallBold" themeColor="olive">
                PART {index + 1}
              </ThemedText>
              <ThemedText style={styles.title}>{topic.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {topic.description}
              </ThemedText>
              <View style={styles.meta}>
                <SymbolView name="list.bullet" size={13} tintColor={Colors.textSecondary} style={styles.metaIcon} />
                <ThemedText type="small" themeColor="textSecondary">
                  {topic.sections.length} sections
                </ThemedText>
              </View>
            </View>
          </PressableScale>
        </Link.Trigger>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  subtitle: {
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.one,
  },
  card: {
    ...Shape.card,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElement,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.backgroundSelected,
  },
  body: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.2,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: TITLE_SIZE * -0.03,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  metaIcon: {
    width: 14,
    height: 14,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
