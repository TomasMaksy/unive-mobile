import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import {
  aboutDraft,
  loadPlaces,
  needsUniversity,
  type Place,
  placeName,
  saveEducation,
  saveInterests,
  saveLocation,
  type School,
  schoolLabel,
  type StudyInterest,
} from '@/features/knowledge/about';
import { formatScore, SCORES } from '@/features/knowledge/academics';
import { countryName } from '@/features/knowledge/country';
import { pickFrom } from '@/features/knowledge/picker';
import { ScoreSheet } from '@/features/knowledge/score-sheet';
import { siteUrl } from '@/lib/guide';
import { type Academics, EDUCATION_STAGES, type Knowledge, useKnowledge } from '@/lib/knowledge';

const MAX_INTERESTS = 20;
// Lets one search page finish closing before the next opens.
const BETWEEN_PICKS_MS = 450;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * About you: your education, where you live, your scores and what you'd like
 * to study (the website's General tab). Like the Settings app, you tap a row
 * to change it, and it saves as soon as you choose.
 */
export default function KnowledgeAboutScreen() {
  const knowledge = useKnowledge();
  // Country and state names come from unive-v2; shown once they've loaded.
  const [, setPlacesLoaded] = useState(false);

  useEffect(() => {
    loadPlaces().then(
      () => setPlacesLoaded(true),
      () => {},
    );
  }, []);

  if (!knowledge) return null;
  return <About knowledge={knowledge} />;
}

function About({ knowledge }: { knowledge: Knowledge }) {
  const router = useRouter();
  const about = aboutDraft(knowledge);
  const { academics } = knowledge.static;
  // The row that's saving, which shows a spinner instead of its chevron.
  const [busy, setBusy] = useState<string | null>(null);

  async function run(row: string, save: () => Promise<void>) {
    setBusy(row);
    try {
      await save();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  // Education saves as a whole: a stage, a high school, and a university for
  // college stages. Anything still missing is asked for next.
  async function changeEducation(row: string, change: { stage?: string; highSchool?: School; university?: School }) {
    let stage = change.stage ?? about.stage;
    let highSchool = change.highSchool ?? about.highSchool;
    let university = change.university ?? about.university;
    let asked = false;
    const ask = async (kind: 'stage' | 'highSchool' | 'university') => {
      if (asked) await wait(BETWEEN_PICKS_MS);
      asked = true;
      return pickFrom(router, kind, { country: about.country, state: about.state });
    };
    if (!stage) stage = ((await ask('stage')) as Place | undefined)?.code ?? null;
    if (!stage) return;
    if (!highSchool) highSchool = ((await ask('highSchool')) as School | undefined) ?? null;
    if (!highSchool) return;
    if (needsUniversity(stage) && !university) university = ((await ask('university')) as School | undefined) ?? null;
    if (needsUniversity(stage) && !university) return;
    await run(row, () => saveEducation(stage!, highSchool!, university));
  }

  async function pickStage() {
    const picked = (await pickFrom(router, 'stage', { selected: about.stage })) as Place | undefined;
    if (picked && picked.code !== about.stage) {
      // Moving to college asks for your university next.
      if (needsUniversity(picked.code) && !about.university) await wait(BETWEEN_PICKS_MS);
      await changeEducation('stage', { stage: picked.code });
    }
  }

  async function pickSchool(kind: 'highSchool' | 'university') {
    const picked = (await pickFrom(router, kind, { country: about.country, state: about.state })) as School | undefined;
    if (picked) await changeEducation(kind, { [kind]: picked });
  }

  async function pickCountry() {
    const picked = (await pickFrom(router, 'country', { selected: about.country })) as Place | undefined;
    if (!picked || picked.code === about.country) return;
    if (picked.code !== 'US') return run('country', () => saveLocation(picked.code, null));
    // The US also needs a state.
    await wait(BETWEEN_PICKS_MS);
    const state = (await pickFrom(router, 'state', { selected: about.state })) as Place | undefined;
    if (state) await run('country', () => saveLocation('US', state.code));
  }

  async function pickState() {
    const picked = (await pickFrom(router, 'state', { selected: about.state })) as Place | undefined;
    if (picked && picked.code !== about.state) await run('state', () => saveLocation('US', picked.code));
  }

  // The score being changed, in a sheet over this page.
  const [scoreKey, setScoreKey] = useState<keyof Academics | null>(null);
  function editScore(key: keyof Academics) {
    setScoreKey(key);
  }

  async function addInterest() {
    const picked = (await pickFrom(router, 'interest')) as StudyInterest | undefined;
    if (!picked || about.interests.some((interest) => interest.cipCode === picked.cipCode)) return;
    await run('interests', () => saveInterests([...about.interests, picked]));
  }

  function removeInterest(interest: StudyInterest) {
    Alert.alert(`Remove ${interest.name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void run('interests', () => saveInterests(about.interests.filter((entry) => entry.cipCode !== interest.cipCode))),
      },
    ]);
  }

  const countryLabel = placeName('country', about.country) ?? countryName(about.country);
  const stateLabel = placeName('state', about.state) ?? about.state;

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: 'Library' }} />
      <ScoreSheet scoreKey={scoreKey} current={scoreKey ? academics[scoreKey] : null} onClose={() => setScoreKey(null)} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PageTitle>About you</PageTitle>
          <ThemedText type="small" themeColor="textSecondary">
            Tap anything to change it.
          </ThemedText>
        </View>

        <Card icon="/isomorphic-icons/school.webp" title="Education">
          <Row label="Stage" value={about.stage ? (EDUCATION_STAGES[about.stage] ?? null) : null} busy={busy === 'stage'} onPress={pickStage} />
          <Row label="High school" value={schoolLabel(about.highSchool)} busy={busy === 'highSchool'} onPress={() => pickSchool('highSchool')} />
          {needsUniversity(about.stage) ? (
            <Row label="University" value={schoolLabel(about.university)} busy={busy === 'university'} onPress={() => pickSchool('university')} />
          ) : null}
        </Card>

        <Card icon="/isomorphic-icons/map.webp" title="Location">
          <Row label="Country" value={countryLabel} busy={busy === 'country'} onPress={pickCountry} />
          {about.country === 'US' ? <Row label="State" value={stateLabel} busy={busy === 'state'} onPress={pickState} /> : null}
        </Card>

        <Card icon="/isomorphic-icons/academic-achievements.webp" title="Scores">
          {SCORES.map((score) => (
            <Row
              key={score.key}
              label={score.label}
              value={formatScore(score.key, academics[score.key])}
              placeholder="Add"
              onPress={() => editScore(score.key)}
            />
          ))}
        </Card>

        <Card icon="/isomorphic-icons/lightbulb.webp" title="Study interests" busy={busy === 'interests'}>
          <Animated.View layout={LinearTransition} style={styles.chips}>
            {about.interests.map((interest) => (
              <Animated.View key={interest.cipCode} entering={FadeIn} layout={LinearTransition} style={styles.chipCell}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`${interest.name}. Tap to remove.`}
                  onPress={() => removeInterest(interest)}
                  style={styles.chip}>
                  <ThemedText type="small" style={styles.chipText}>
                    {interest.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    ✕
                  </ThemedText>
                </PressableScale>
              </Animated.View>
            ))}
            {about.interests.length < MAX_INTERESTS ? (
              <Animated.View layout={LinearTransition}>
                <PressableScale haptic accessibilityRole="button" onPress={addInterest} style={[styles.chip, styles.addChip]}>
                  <ThemedText type="small" style={styles.addText}>
                    + Add interest
                  </ThemedText>
                </PressableScale>
              </Animated.View>
            ) : null}
          </Animated.View>
        </Card>
      </ScrollView>
    </>
  );
}

function Card({ icon, title, busy, children }: { icon: string; title: string; busy?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Image source={{ uri: siteUrl(icon) }} style={styles.cardIcon} contentFit="contain" transition={200} />
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        {busy ? <ActivityIndicator size="small" color={Colors.textSecondary} style={styles.cardBusy} /> : null}
      </View>
      {children}
    </View>
  );
}

// A row you tap to change: the label, what's set, and a chevron.
function Row({
  label,
  value,
  placeholder = 'Choose',
  busy,
  onPress,
}: {
  label: string;
  value: string | null;
  placeholder?: string;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value ?? 'not set'}`}
      disabled={busy}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <ThemedText themeColor="textSecondary" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText themeColor={value ? 'text' : 'olive'} style={styles.rowValue} numberOfLines={2}>
        {value ?? placeholder}
      </ThemedText>
      {busy ? (
        <ActivityIndicator size="small" color={Colors.textSecondary} style={styles.rowAccessory} />
      ) : (
        <ThemedText themeColor="textMuted" style={[styles.chevron, styles.rowAccessory]}>
          ›
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: { paddingHorizontal: Spacing.one, gap: Spacing.one, marginBottom: Spacing.one },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.one,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  cardIcon: { width: 40, height: 40 },
  cardTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  cardBusy: { marginRight: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    // Reaches the card's edges, so the pressed highlight does too.
    marginHorizontal: -(Spacing.three + Spacing.one),
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingVertical: Spacing.two + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowPressed: { backgroundColor: Colors.backgroundSelected },
  rowLabel: { flexShrink: 0 },
  rowValue: { flex: 1, textAlign: 'right' },
  rowAccessory: { width: 14, marginLeft: -Spacing.two },
  chevron: { fontSize: 24, lineHeight: 26, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingTop: Spacing.one, paddingBottom: Spacing.two },
  chipCell: { maxWidth: '100%' },
  // Rounded rather than a pill: long subject names wrap onto two lines.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: Colors.backgroundGrouped,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  chipText: { flexShrink: 1 },
  addChip: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: '#c5c9a4' },
  addText: { fontFamily: Fonts.sansMedium, color: Colors.olive },
});
