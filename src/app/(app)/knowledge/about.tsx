import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AboutForm } from '@/components/about-form';
import { TextFieldRegistry, useTextFieldValues } from '@/components/native-text-field-types';
import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import {
  type AboutDraft,
  aboutDraft,
  aboutProblem,
  loadPlaces,
  needsUniversity,
  type Place,
  placeName,
  saveAbout,
  type School,
  schoolLabel,
  type StudyInterest,
} from '@/features/knowledge/about';
import { academicsDraft, parseAcademics } from '@/features/knowledge/academics';
import { countryName } from '@/features/knowledge/country';
import { pickFrom, type PickKind } from '@/features/knowledge/picker';
import { siteUrl } from '@/lib/guide';
import { EDUCATION_STAGES, type Knowledge, useKnowledge } from '@/lib/knowledge';
import type { Draft, DraftValue } from '@/lib/knowledge-fields';

type Editing = { draft: AboutDraft; scores: Draft };

/**
 * About you: your education, where you live, your scores and what you'd like
 * to study (the website's General tab). Edit turns the page into a form;
 * schools, places and interests are chosen on a search page.
 */
export default function KnowledgeAboutScreen() {
  const router = useRouter();
  const knowledge = useKnowledge();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  // Country and state names come from unive-v2; shown once they've loaded.
  const [, setPlacesLoaded] = useState(false);
  const fields = useTextFieldValues();

  useEffect(() => {
    loadPlaces().then(
      () => setPlacesLoaded(true),
      () => {},
    );
  }, []);

  if (!knowledge) return null;

  function startEditing() {
    void Haptics.selectionAsync();
    setEditing({ draft: aboutDraft(knowledge!), scores: academicsDraft(knowledge!.static.academics) });
  }

  async function pick(kind: PickKind) {
    if (!editing) return;
    const value = await pickFrom(router, kind, { country: editing.draft.country, state: editing.draft.state });
    if (!value) return;
    setEditing((current) => {
      if (!current) return current;
      const draft = current.draft;
      switch (kind) {
        case 'highSchool':
          return { ...current, draft: { ...draft, highSchool: value as School } };
        case 'university':
          return { ...current, draft: { ...draft, university: value as School } };
        case 'country': {
          const code = (value as Place).code;
          return { ...current, draft: { ...draft, country: code, state: code === 'US' ? draft.state : null } };
        }
        case 'state':
          return { ...current, draft: { ...draft, state: (value as Place).code } };
        case 'interest': {
          const interest = value as StudyInterest;
          if (draft.interests.some((entry) => entry.cipCode === interest.cipCode)) return current;
          return { ...current, draft: { ...draft, interests: [...draft.interests, interest] } };
        }
      }
    });
  }

  async function save() {
    if (!editing) return;
    const problem = aboutProblem(editing.draft);
    // The exact text in each score field, including a last keystroke not yet reported.
    const scores = parseAcademics({ ...editing.scores, ...fields.read() });
    if (problem) {
      Alert.alert('Almost there', problem);
      return;
    }
    if (!scores) {
      Alert.alert('Check your scores', 'GPA goes up to 4.00, ACT from 1 to 36, and each SAT part from 200 to 800.');
      return;
    }
    setSaving(true);
    try {
      await saveAbout(aboutDraft(knowledge!), editing.draft, { before: knowledge!.static.academics, after: scores });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(null);
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: 'Library',
          // While editing, Cancel replaces the back button (and the swipe back).
          headerBackVisible: !editing,
          gestureEnabled: !editing,
          headerTitle: editing ? 'Edit About You' : '',
        }}
      />
      {editing ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={() => setEditing(null)}>Cancel</Stack.Toolbar.Button>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button variant="prominent" tintColor={Colors.olive} disabled={saving} onPress={save}>
              {saving ? 'Saving…' : 'Done'}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        </>
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={startEditing}>Edit</Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

      {editing ? (
        <Animated.View key="edit" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.flex}>
          <TextFieldRegistry value={fields.registry}>
            <AboutForm
              draft={editing.draft}
              onChange={(draft) => setEditing((current) => (current ? { ...current, draft } : current))}
              scores={editing.scores}
              onScoreChange={(key: string, value: DraftValue) =>
                setEditing((current) => (current ? { ...current, scores: { ...current.scores, [key]: value } } : current))
              }
              onPick={(kind) => void pick(kind)}
              countryLabel={placeName('country', editing.draft.country) ?? countryName(editing.draft.country)}
              stateLabel={placeName('state', editing.draft.state) ?? editing.draft.state}
            />
          </TextFieldRegistry>
        </Animated.View>
      ) : (
        <Animated.View key="view" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.flex}>
          <AboutView knowledge={knowledge} />
        </Animated.View>
      )}
    </>
  );
}

function AboutView({ knowledge }: { knowledge: Knowledge }) {
  const { academics } = knowledge.static;
  const about = aboutDraft(knowledge);
  const score = (value: number | null) => (value == null ? null : String(value));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PageTitle>About you</PageTitle>
        <ThemedText type="small" themeColor="textSecondary">
          Your school, where you live, your scores and what you’d like to study.
        </ThemedText>
      </View>

      <Card icon="/isomorphic-icons/school.webp" title="Education">
        <Row label="Stage" value={about.stage ? (EDUCATION_STAGES[about.stage] ?? null) : null} />
        <Row label="High school" value={schoolLabel(about.highSchool)} />
        {needsUniversity(about.stage) ? <Row label="University" value={schoolLabel(about.university)} /> : null}
      </Card>

      <Card icon="/isomorphic-icons/map.webp" title="Location">
        <Row label="Country" value={placeName('country', about.country) ?? countryName(about.country)} />
        {about.country === 'US' ? <Row label="State" value={placeName('state', about.state) ?? about.state} /> : null}
      </Card>

      <Card icon="/isomorphic-icons/academic-achievements.webp" title="Scores">
        <Row label="GPA" value={academics.gpa == null ? null : academics.gpa.toFixed(2)} />
        <Row label="ACT" value={score(academics.actComposite)} />
        <Row label="SAT Reading & Writing" value={score(academics.satReading)} />
        <Row label="SAT Math" value={score(academics.satMath)} />
      </Card>

      <Card icon="/isomorphic-icons/lightbulb.webp" title="Study interests">
        {about.interests.length === 0 ? (
          <ThemedText themeColor="textMuted">None yet. Tap Edit to add what you’d like to study.</ThemedText>
        ) : (
          <View style={styles.chips}>
            {about.interests.map((interest) => (
              <View key={interest.cipCode} style={styles.chip}>
                <ThemedText type="small">{interest.name}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Image source={{ uri: siteUrl(icon) }} style={styles.cardIcon} contentFit="contain" transition={200} />
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <ThemedText themeColor="textSecondary" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText themeColor={value ? 'text' : 'textMuted'} style={styles.rowValue}>
        {value ?? '—'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: { paddingHorizontal: Spacing.one, gap: Spacing.one, marginBottom: Spacing.one },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.two,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  cardIcon: { width: 40, height: 40 },
  cardTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowLabel: { flexShrink: 0 },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Rounded rather than a pill: long subject names wrap onto two lines.
  chip: { borderRadius: 14, borderCurve: 'continuous', backgroundColor: Colors.backgroundGrouped, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 1 },
});
