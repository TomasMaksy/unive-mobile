import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { KnowledgeForm } from '@/components/knowledge-form';
import { TextFieldRegistry, useTextFieldValues } from '@/components/native-text-field-types';
import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { ACADEMICS_FORM, academicsDraft, parseAcademics } from '@/features/knowledge/academics';
import { countryName } from '@/features/knowledge/country';
import { siteUrl } from '@/lib/guide';
import { EDUCATION_STAGES, type Knowledge, saveAcademics, schoolName, useKnowledge } from '@/lib/knowledge';
import type { Draft, DraftValue } from '@/lib/knowledge-fields';

/**
 * About you: your education, where you live, your scores and what you'd like
 * to study (the website's General tab). Edit changes the scores in place.
 */
export default function KnowledgeAboutScreen() {
  const knowledge = useKnowledge();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const fields = useTextFieldValues();
  if (!knowledge) return null;
  const editing = draft !== null;
  const before = knowledge.static.academics;

  async function save() {
    // The exact text in each field, including a last keystroke not yet reported.
    const latest = parseAcademics({ ...draft, ...fields.read() });
    if (!latest) {
      Alert.alert('Check your scores', 'GPA goes up to 4.00, ACT from 1 to 36, and each SAT part from 200 to 800.');
      return;
    }
    setSaving(true);
    try {
      await saveAcademics(before, latest);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDraft(null);
    } catch (error) {
      Alert.alert("Couldn't save your scores", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: 'Library',
          headerBackVisible: !editing,
          gestureEnabled: !editing,
          headerTitle: editing ? 'Edit Scores' : '',
        }}
      />
      {editing ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={() => setDraft(null)}>Cancel</Stack.Toolbar.Button>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button variant="prominent" tintColor={Colors.olive} disabled={saving || parseAcademics(draft) === null} onPress={save}>
              {saving ? 'Saving…' : 'Done'}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        </>
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            onPress={() => {
              void Haptics.selectionAsync();
              setDraft(academicsDraft(before));
            }}>
            Edit
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

      {editing ? (
        <Animated.View key="edit" entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.flex}>
          <TextFieldRegistry value={fields.registry}>
            <KnowledgeForm
              sections={ACADEMICS_FORM}
              draft={draft}
              onChange={(key: string, value: DraftValue) => setDraft((current) => (current ? { ...current, [key]: value } : current))}
              activities={[]}
            />
          </TextFieldRegistry>
        </Animated.View>
      ) : (
        <Animated.View key="view" entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.flex}>
          <AboutView knowledge={knowledge} />
        </Animated.View>
      )}
    </>
  );
}

function AboutView({ knowledge }: { knowledge: Knowledge }) {
  const { academics, education, location } = knowledge.static;
  const highSchool = schoolName(education.highSchool);
  const university = schoolName(education.university);
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
        <Row label="Stage" value={education.educationStage ? EDUCATION_STAGES[education.educationStage] ?? null : null} />
        {highSchool || !university ? <Row label="High school" value={highSchool} /> : null}
        {university ? <Row label="University" value={university} /> : null}
        <Row label="Country" value={countryName(location.country)} />
        {location.country === 'US' ? <Row label="State" value={location.state ?? null} /> : null}
      </Card>

      <Card icon="/isomorphic-icons/academic-achievements.webp" title="Scores">
        <Row label="GPA" value={academics.gpa == null ? null : academics.gpa.toFixed(2)} />
        <Row label="ACT" value={score(academics.actComposite)} />
        <Row label="SAT Reading & Writing" value={score(academics.satReading)} />
        <Row label="SAT Math" value={score(academics.satMath)} />
      </Card>

      <Card icon="/isomorphic-icons/lightbulb.webp" title="Study interests">
        {knowledge.studyInterests.length === 0 ? (
          <ThemedText themeColor="textMuted">None yet</ThemedText>
        ) : (
          <View style={styles.chips}>
            {knowledge.studyInterests.map((interest) => (
              <View key={interest.cipCode} style={styles.chip}>
                <ThemedText type="small">{interest.name}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </Card>

      <ThemedText type="small" themeColor="textMuted" style={styles.footnote}>
        Changing your school, location and study interests in the app is coming soon. You can change them on the website.
      </ThemedText>
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
  chip: { ...Shape.pill, backgroundColor: Colors.backgroundGrouped, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 1 },
  footnote: { paddingHorizontal: Spacing.one },
});
