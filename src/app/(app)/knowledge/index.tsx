import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { ErrorState, Loader, Loading, PressableScale, Progress, Text } from '@/components/ui';
import { alpha, colors, haptics, riseIn, shape, space } from '@/theme';
import { Bookshelf } from '@/features/knowledge/bookshelf';
import { schoolLabel, toSchool } from '@/features/knowledge/about';
import { countryName } from '@/features/knowledge/country';
import { isWorking, mergedConflicts, useUploads } from '@/features/knowledge/dropzone';
import { countOf, SECTION_ICON, SECTION_ORDER, SECTIONS } from '@/features/knowledge/sections';
import { siteUrl } from '@/lib/guide';
import { EDUCATION_STAGES, type Knowledge, type KnowledgeKind, refreshKnowledge, useKnowledge } from '@/lib/knowledge';

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
          <ErrorState
            message="Couldn’t load your Knowledge Library."
            onRetry={() => {
              setFailed(false);
              return refreshKnowledge().catch(() => setFailed(true));
            }}
          />
        ) : (
          <Loading />
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

function Appear({ index, style, children }: { index: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Animated.View entering={riseIn(index)} style={style}>
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
          <PageTitle>Knowledge Library</PageTitle>
          <Text variant="title" style={styles.numbers}>
            {`${percent}%`}
            <Text variant="small" color="textSecondary">
              {'  complete'}
            </Text>
          </Text>
          <Progress value={Math.min(100, percent)} accessibilityLabel={`${percent}% complete`} />
        </View>
      </View>
      <Text variant="small" color="textSecondary">
        Everything the AI knows about you. The more it knows, the better its advice.
      </Text>
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
        <Text variant="headline">Add documents</Text>
        <Text variant="small" color={reading || toCheck ? 'accent' : 'textSecondary'}>
          {status}
        </Text>
      </View>
      {reading ? <Loader size={16} color={colors.accent} accessibilityLabel="" /> : null}
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
          <Text variant="headline">About you</Text>
          <Text variant="small" color="textSecondary" numberOfLines={2}>
            {[stage, school, where].filter(Boolean).join(' · ') || 'Your school, location and scores'}
          </Text>
        </View>
        <SymbolView name="chevron.right" size={14} weight="semibold" tintColor={colors.textMuted} />
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
      <Text variant="title" color={value == null ? 'textMuted' : 'text'} style={styles.numbers}>
        {value ?? '—'}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
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
        haptics.tick();
        router.push({ pathname: '/knowledge/[kind]', params: { kind } });
      }}
      style={[styles.card, styles.tile]}>
      <Image source={{ uri: SECTION_ICON(kind) }} style={styles.tileArt} contentFit="contain" transition={200} />
      <View>
        <Text variant="headline">{section.title}</Text>
        <Text variant="small" color="textSecondary">
          {count === 0 ? 'Add your first' : String(count)}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.backgroundGrouped },
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[4],
  },
  flex: { flex: 1, gap: space[0.5] },
  header: { gap: space[2], paddingHorizontal: space[1] },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  heroText: { flex: 1, gap: space[2] },
  numbers: { fontVariant: ['tabular-nums'] },
  card: {
    ...shape.card,
    backgroundColor: colors.surface,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[4],
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: alpha('meadow', 0.4),
  },
  dropzoneArt: { width: 60, height: 60 },
  about: { padding: space[4], paddingLeft: space[5], gap: space[4] },
  aboutTop: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  stats: { flexDirection: 'row', gap: space[2] },
  stat: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space[3] },
  tileCell: { width: '48.5%' },
  tile: { padding: space[4], gap: space[2], minHeight: 128, justifyContent: 'space-between' },
  tileArt: { width: 52, height: 52 },
});
