import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuideBlocks } from '@/components/guide-blocks';
import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { GuideListenBar } from '@/features/guide/guide-listen-bar';
import {
  fetchGuideAudio,
  fetchGuideTopic,
  type GuideAudioSegment,
  type GuideTopic,
  markGuideRead,
  siteUrl,
} from '@/lib/guide';

const TITLE_SIZE = 34;
const HEADING_SIZE = 26;
const LISTEN_BAR_SPACE = 96;

/**
 * One guide topic, read like an App Store story: it zooms open from its card,
 * the picture on top, then the lesson. A contents card jumps to a section,
 * and the narrator can read it aloud.
 */
export default function GuideTopicScreen() {
  // The card passes its picture along, so the page has it from the first frame of the zoom.
  const { topic: topicId, image } = useLocalSearchParams<{ topic: string; image?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Where each section starts in the article, and where the article starts in the page.
  const sectionY = useRef<Record<string, number>>({});
  const articleY = useRef(0);

  const [topic, setTopic] = useState<GuideTopic | null>(null);
  const [failed, setFailed] = useState(false);
  const [audio, setAudio] = useState<GuideAudioSegment[]>([]);
  const [listenRequest, setListenRequest] = useState<{ id: string; n: number } | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGuideTopic(topicId).then(
      (loaded) => {
        setTopic(loaded);
        fetchGuideAudio(loaded).then(setAudio);
      },
      () => setFailed(true),
    );
    // Opening a topic ticks it off on your roadmap, as on the website.
    void markGuideRead(topicId);
  }, [topicId]);

  const audioIds = new Set(audio.map((segment) => segment.id));

  function scrollTo(sectionId: string) {
    const y = sectionY.current[sectionId];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: articleY.current + y - insets.top - Spacing.six, animated: true });
  }

  function listen(id: string) {
    setListenRequest((current) => ({ id, n: (current?.n ?? 0) + 1 }));
  }

  // Follows the narrator from section to section.
  const onSegmentChange = useCallback((id: string | null) => {
    setPlayingId(id);
  }, []);
  useEffect(() => {
    if (playingId && playingId !== 'intro') scrollTo(playingId);
    // scrollTo only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingId]);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + LISTEN_BAR_SPACE }}>
        <View style={{ height: width * 0.78 }}>
          {/* The card's picture grows into this one (Apple's zoom transition). */}
          <Link.AppleZoomTarget>
            <Image
              source={image || topic ? { uri: siteUrl(image ?? topic!.imagePath) } : null}
              style={[styles.hero, { height: width * 0.78 }]}
              contentFit="cover"
            />
          </Link.AppleZoomTarget>
          <View pointerEvents="none" style={styles.heroFade} />
        </View>

        {topic ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.article}
            onLayout={(event) => {
              articleY.current = event.nativeEvent.layout.y;
            }}>
            <ThemedText style={styles.title}>{topic.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.description}>
              {topic.description}
            </ThemedText>

            {topic.intro.length > 0 && <GuideBlocks blocks={topic.intro} />}

            <Animated.View entering={FadeInDown.delay(120)} style={styles.contents}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.contentsTitle}>
                IN THIS GUIDE
              </ThemedText>
              {topic.sections.map((section, index) => (
                <Pressable
                  key={section.id}
                  onPress={() => scrollTo(section.id)}
                  style={({ pressed }) => [styles.contentsRow, index > 0 && styles.contentsDivider, pressed && styles.pressed]}>
                  <ThemedText style={styles.contentsEmoji}>{section.emoji ?? '•'}</ThemedText>
                  <ThemedText style={styles.contentsLabel} numberOfLines={2}>
                    {section.tocTitle}
                  </ThemedText>
                  <SymbolView name="chevron.down" size={12} tintColor={Colors.textMuted} style={styles.chevron} />
                </Pressable>
              ))}
            </Animated.View>

            {topic.sections.map((section) => (
              <View
                key={section.id}
                style={styles.section}
                onLayout={(event) => {
                  sectionY.current[section.id] = event.nativeEvent.layout.y;
                }}>
                <View style={styles.headingRow}>
                  <ThemedText style={styles.heading}>
                    {section.emoji ? `${section.emoji} ` : ''}
                    {section.title}
                  </ThemedText>
                  {audioIds.has(section.id) ? (
                    <PressableScale
                      haptic
                      pressedScale={0.88}
                      onPress={() => listen(section.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Listen to ${section.title}`}
                      style={[styles.listen, playingId === section.id && styles.listening]}>
                      <SymbolView
                        name={playingId === section.id ? 'waveform' : 'speaker.wave.2.fill'}
                        size={15}
                        tintColor={playingId === section.id ? '#ffffff' : Colors.olive}
                        animationSpec={playingId === section.id ? { effect: { type: 'pulse' }, repeating: true } : undefined}
                        style={styles.listenIcon}
                      />
                    </PressableScale>
                  ) : null}
                </View>
                <GuideBlocks blocks={section.blocks} />
              </View>
            ))}
          </Animated.View>
        ) : failed ? (
          <Pressable onPress={() => router.back()} style={styles.status}>
            <ThemedText themeColor="textSecondary">Couldn’t load this guide.</ThemedText>
            <ThemedText themeColor="olive">Go back</ThemedText>
          </Pressable>
        ) : (
          <ActivityIndicator style={styles.status} color={Colors.textSecondary} />
        )}
      </ScrollView>

      {/* Keeps the status bar readable over the text scrolling under it. */}
      <View pointerEvents="none" style={[styles.topFade, { height: insets.top + Spacing.five + Spacing.three }]} />
      <View style={[styles.close, { top: insets.top + Spacing.two }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      {audio.length > 0 && (
        <GuideListenBar segments={audio} request={listenRequest} onSegmentChange={onSegmentChange} bottomInset={insets.bottom} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    width: '100%',
    backgroundColor: Colors.backgroundSelected,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    experimental_backgroundImage: `linear-gradient(0deg, ${Colors.background}, rgba(249, 249, 247, 0))`,
  },
  article: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    marginTop: -Spacing.three,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.15,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: TITLE_SIZE * -0.03,
  },
  description: {
    marginTop: -Spacing.three,
    fontSize: 17,
    lineHeight: 25,
  },
  contents: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    paddingVertical: Spacing.two,
  },
  contentsTitle: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    letterSpacing: 0.4,
  },
  contentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
  },
  contentsDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    marginLeft: Spacing.three,
    paddingLeft: 0,
  },
  pressed: {
    backgroundColor: Colors.backgroundSelected,
  },
  contentsEmoji: {
    width: 24,
    textAlign: 'center',
  },
  contentsLabel: {
    flex: 1,
  },
  chevron: {
    width: 14,
    height: 14,
  },
  section: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  heading: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: HEADING_SIZE,
    lineHeight: HEADING_SIZE * 1.2,
    letterSpacing: HEADING_SIZE * -0.03,
  },
  listen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111, 118, 68, 0.12)',
  },
  listening: {
    backgroundColor: Colors.olive,
  },
  listenIcon: {
    width: 18,
    height: 18,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    experimental_backgroundImage: `linear-gradient(180deg, ${Colors.background} 55%, rgba(249, 249, 247, 0))`,
  },
  close: {
    position: 'absolute',
    left: Spacing.four,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
