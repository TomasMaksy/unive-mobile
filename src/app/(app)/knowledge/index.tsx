import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { Bookshelf } from '@/features/knowledge/bookshelf';
import { schoolLabel, toSchool } from '@/features/knowledge/about';
import { countryName } from '@/features/knowledge/country';
import { isWorking, mergedConflicts, useUploads } from '@/features/knowledge/dropzone';
import { countOf, SECTION_ICON, SECTION_ORDER, SECTIONS } from '@/features/knowledge/sections';
import { siteUrl } from '@/lib/guide';
import { EDUCATION_STAGES, type Knowledge, type KnowledgeKind, refreshKnowledge, useKnowledge } from '@/lib/knowledge';

const TITLE_SIZE = 32;
const PERCENT_SIZE = 26;
const SHELF_SIZE = 132;

/** Everything the AI knows about you, like the website's Knowledge Library. Opened from the profile. */
export default function KnowledgeScreen() {
  const knowledge = useKnowledge();
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshKnowledge().catch(() => setFailed(true));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await refreshKnowledge().catch(() => {});
    setRefreshing(false);
  }

  if (!knowledge) {
    return (
      <View style={styles.center}>
        {failed ? (
          <Pressable
            onPress={() => {
              setFailed(false);
              refreshKnowledge().catch(() => setFailed(true));
            }}
            style={styles.retry}>
            <ThemedText themeColor="textSecondary">Couldn’t load your Knowledge Library.</ThemedText>
            <ThemedText themeColor="olive">Try again</ThemedText>
          </Pressable>
        ) : (
          <ActivityIndicator color={Colors.textSecondary} />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Header knowledge={knowledge} />
      <Appear index={1}>
        <DropzoneCard />
      </Appear>
      <Appear index={2}>
        <AboutCard knowledge={knowledge} />
      </Appear>
      <View style={styles.grid}>
        {SECTION_ORDER.map((kind, index) => (
          <Appear key={kind} index={3 + index} style={styles.tileCell}>
            <SectionTile kind={kind} count={countOf(knowledge, kind)} />
          </Appear>
        ))}
      </View>
    </ScrollView>
  );
}

function Appear({ index, style, children }: { index: number; style?: object; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(40 * index).duration(380)} style={style}>
      {children}
    </Animated.View>
  );
}

// The reading room filling up, with the title and how complete the library is.
function Header({ knowledge }: { knowledge: Knowledge }) {
  const percent = Math.round(knowledge.completion.displayPercent);
  return (
    <View style={styles.header}>
      <View style={styles.hero}>
        <Bookshelf percent={percent} size={SHELF_SIZE} />
        <View style={styles.heroText}>
          <ThemedText accessibilityRole="header" style={styles.title}>
            Knowledge Library
          </ThemedText>
          <ThemedText style={styles.percent}>
            {`${percent}%`}
            <ThemedText type="small" themeColor="textSecondary">
              {'  complete'}
            </ThemedText>
          </ThemedText>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(100, percent)}%` }]} />
          </View>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Everything the AI knows about you. The more it knows, the better its advice.
      </ThemedText>
    </View>
  );
}

// The website's Dropzone, its own card rather than a tab.
function DropzoneCard() {
  const router = useRouter();
  const uploads = useUploads();
  const reading = uploads.filter(isWorking).length;
  const toCheck = mergedConflicts(uploads).length;
  const status = reading
    ? `Reading ${reading} ${reading === 1 ? 'document' : 'documents'}…`
    : toCheck
      ? `${toCheck} to check`
      : 'Your CV, transcripts or certificates, and Unive fills in the rest.';

  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel="Add documents"
      onPress={() => router.push('/knowledge/dropzone')}
      style={[styles.card, styles.dropzone]}>
      <Image source={{ uri: siteUrl('/isomorphic-icons/cv.webp') }} style={styles.dropzoneArt} contentFit="contain" />
      <View style={styles.flex}>
        <ThemedText style={styles.cardTitle}>Add documents</ThemedText>
        <ThemedText type="small" themeColor={reading || toCheck ? 'olive' : 'textSecondary'}>
          {status}
        </ThemedText>
      </View>
      {reading ? <ActivityIndicator size="small" color={Colors.olive} /> : null}
    </PressableScale>
  );
}

// Your school, where you are and your scores, in one card.
function AboutCard({ knowledge }: { knowledge: Knowledge }) {
  const router = useRouter();
  const { academics, education, location } = knowledge.static;
  const school = schoolLabel(toSchool(education.university)) ?? schoolLabel(toSchool(education.highSchool));
  const stage = education.educationStage ? EDUCATION_STAGES[education.educationStage] : null;
  const where = [location.country === 'US' ? location.state : null, countryName(location.country)].filter(Boolean).join(', ');
  const sat = academics.satReading != null && academics.satMath != null ? academics.satReading + academics.satMath : null;

  return (
    <PressableScale haptic accessibilityRole="button" onPress={() => router.push('/knowledge/about')} style={[styles.card, styles.about]}>
      <View style={styles.aboutTop}>
        <View style={styles.flex}>
          <ThemedText style={styles.cardTitle}>About you</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {[stage, school, where].filter(Boolean).join(' · ') || 'Your school, location and scores'}
          </ThemedText>
        </View>
        <ThemedText themeColor="textMuted" style={styles.chevron}>
          ›
        </ThemedText>
      </View>
      <View style={styles.stats}>
        <Stat label="GPA" value={academics.gpa == null ? null : academics.gpa.toFixed(2)} />
        <Stat label="SAT" value={sat == null ? null : String(sat)} />
        <Stat label="ACT" value={academics.actComposite == null ? null : String(academics.actComposite)} />
        <Stat label="Interests" value={String(knowledge.studyInterests.length)} />
      </View>
    </PressableScale>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.stat}>
      <ThemedText style={[styles.statValue, value == null && { color: Colors.textMuted }]}>{value ?? '—'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function SectionTile({ kind, count }: { kind: KnowledgeKind; count: number }) {
  const router = useRouter();
  const section = SECTIONS[kind];
  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel={`${section.title}, ${count}`}
      onPress={() => {
        void Haptics.selectionAsync();
        router.push({ pathname: '/knowledge/[kind]', params: { kind } });
      }}
      style={[styles.card, styles.tile]}>
      <Image source={{ uri: SECTION_ICON(kind) }} style={styles.tileArt} contentFit="contain" transition={200} />
      <View>
        <ThemedText style={styles.tileTitle}>{section.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {count === 0 ? 'Add your first' : String(count)}
        </ThemedText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundGrouped,
  },
  retry: { alignItems: 'center', gap: Spacing.one },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  flex: { flex: 1, gap: Spacing.half },
  header: { gap: Spacing.two, paddingHorizontal: Spacing.one },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroText: { flex: 1, gap: Spacing.two },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.08,
    letterSpacing: TITLE_SIZE * -0.03,
  },
  percent: {
    fontFamily: Fonts.heading,
    fontSize: PERCENT_SIZE,
    lineHeight: PERCENT_SIZE * 1.2,
    letterSpacing: PERCENT_SIZE * -0.03,
    fontVariant: ['tabular-nums'],
  },
  track: { height: 6, borderRadius: 3, backgroundColor: '#dcdad2', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.olive },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
  },
  cardTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#f1f2e6',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c5c9a4',
  },
  dropzoneArt: { width: 60, height: 60 },
  about: { padding: Spacing.three, paddingLeft: Spacing.three + Spacing.one, gap: Spacing.three },
  aboutTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chevron: { fontSize: 26, lineHeight: 28 },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1 },
  statValue: { fontFamily: Fonts.heading, fontSize: 22, lineHeight: 26, letterSpacing: 22 * -0.03, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, lineHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.two + Spacing.one },
  tileCell: { width: '48.5%' },
  tile: { padding: Spacing.three, gap: Spacing.two, minHeight: 128, justifyContent: 'space-between' },
  tileArt: { width: 52, height: 52 },
  tileTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 21 },
});
