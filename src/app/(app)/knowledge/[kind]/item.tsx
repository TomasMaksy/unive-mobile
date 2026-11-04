import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { KnowledgeForm } from '@/components/knowledge-form';
import { TextFieldRegistry, useTextFieldValues } from '@/components/native-text-field-types';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { confirmDelete } from '@/features/knowledge/delete';
import { SECTIONS, summaries } from '@/features/knowledge/sections';
import { addItem, formatMonth, type Knowledge, type KnowledgeKind, updateItem, useKnowledge } from '@/lib/knowledge';
import { type Draft, type DraftValue, findItem, FORMS, isComplete } from '@/lib/knowledge-fields';

const TITLE_SIZE = 28;

/**
 * One item of the Knowledge Library, on its own page, like a contact card:
 * easy to read, and Edit turns the same page into a form (Done saves).
 * Without an id it starts as a blank form, for adding one.
 */
export default function KnowledgeItemScreen() {
  // `edit` opens it straight as a form (Edit in the list's long-press menu).
  const { kind, id, edit } = useLocalSearchParams<{ kind: KnowledgeKind; id?: string; edit?: string }>();
  const router = useRouter();
  const knowledge = useKnowledge();
  const spec = FORMS[kind];
  const item = knowledge && id ? findItem(knowledge, kind, id) : undefined;

  const [draft, setDraft] = useState<Draft | null>(() => {
    if (!id) return { ...spec.empty };
    return edit && item ? spec.toDraft(item as never) : null;
  });
  const [saving, setSaving] = useState(false);
  const fields = useTextFieldValues();
  const editing = draft !== null;

  if (!knowledge || !spec || (id && !item)) return null;

  function startEditing() {
    void Haptics.selectionAsync();
    setDraft(spec.toDraft(item as never));
  }

  // Opened to edit from the list's menu, Cancel and Done go back to the list.
  const backToList = !id || Boolean(edit);

  function cancel() {
    if (backToList) router.back();
    else setDraft(null);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      // The exact text in each field, including a last keystroke not yet reported.
      const latest = { ...draft, ...fields.read() };
      const payload = spec.toPayload(latest);
      if (id) {
        await updateItem(kind, id, payload);
        // Languages are known by their name, so a renamed one has a new id.
        if (kind === 'languages' && typeof latest.language === 'string' && latest.language.trim() !== id) {
          router.setParams({ id: latest.language.trim() });
        }
        if (backToList) router.back();
        else setDraft(null);
      } else {
        await addItem(kind, payload);
        router.back();
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(`Couldn't save this ${spec.noun.toLowerCase()}`, error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const activities = knowledge.experiences.map(({ id: activityId, title }) => ({ id: activityId, title }));

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: SECTIONS[kind].title,
          // While editing, Cancel replaces the back button (and the swipe back).
          headerBackVisible: !editing,
          gestureEnabled: !editing,
          headerTitle: editing ? (id ? `Edit ${spec.noun}` : `New ${spec.noun}`) : '',
        }}
      />
      {editing ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={cancel}>Cancel</Stack.Toolbar.Button>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button variant="prominent" tintColor={Colors.olive} disabled={saving || !isComplete(spec, draft)} onPress={save}>
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
        <Animated.View key="edit" entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.flex}>
          <TextFieldRegistry value={fields.registry}>
            <KnowledgeForm
              sections={spec.sections}
              draft={draft}
              onChange={(key: string, value: DraftValue) => setDraft((current) => (current ? { ...current, [key]: value } : current))}
              activities={activities}
              onDelete={id ? () => confirmDelete(kind, id, () => router.back()) : undefined}
              deleteLabel={`Delete ${spec.noun}`}
            />
          </TextFieldRegistry>
        </Animated.View>
      ) : (
        <Animated.View key="view" entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.flex}>
          <ItemView knowledge={knowledge} kind={kind} id={id!} />
        </Animated.View>
      )}
    </>
  );
}

type Fact =
  | { type: 'text'; label: string; value: string }
  | { type: 'chips'; label: string; values: string[] }
  | { type: 'link'; label: string; value: string; url?: string; onPress?: () => void };

// Read-only: the picture, the title, then what there is to know about it.
function ItemView({ knowledge, kind, id }: { knowledge: Knowledge; kind: KnowledgeKind; id: string }) {
  const router = useRouter();
  const summary = summaries(knowledge, kind).find((entry) => entry.id === id);
  if (!summary) return null;
  const isNote = kind === 'notes';

  const openActivity = (activityId: string | null) => {
    const activity = knowledge.experiences.find((experience) => experience.id === activityId);
    return activity
      ? ({
          type: 'link',
          label: 'Activity',
          value: activity.title,
          onPress: () => router.push({ pathname: '/knowledge/[kind]/item', params: { kind: 'experiences', id: activity.id } }),
        } as const)
      : null;
  };

  const facts: (Fact | null)[] = [];
  switch (kind) {
    case 'experiences': {
      const item = knowledge.experiences.find((entry) => entry.id === id)!;
      facts.push(item.description ? { type: 'text', label: 'What you did', value: item.description } : null);
      facts.push(item.skills.length ? { type: 'chips', label: 'Skills', values: item.skills } : null);
      const linked = [
        ...knowledge.achievements.filter((entry) => entry.experienceId === id).map((entry) => ({ kind: 'achievements' as const, id: entry.id, title: entry.title })),
        ...knowledge.references.filter((entry) => entry.experienceId === id).map((entry) => ({ kind: 'references' as const, id: entry.id, title: entry.fullName })),
      ];
      for (const entry of linked) {
        facts.push({
          type: 'link',
          label: entry.kind === 'achievements' ? 'Achievement' : 'Reference',
          value: entry.title,
          onPress: () => router.push({ pathname: '/knowledge/[kind]/item', params: { kind: entry.kind, id: entry.id } }),
        });
      }
      break;
    }
    case 'professions': {
      const item = knowledge.professions.find((entry) => entry.id === id)!;
      facts.push(item.description ? { type: 'text', label: 'What you did', value: item.description } : null);
      break;
    }
    case 'achievements': {
      const item = knowledge.achievements.find((entry) => entry.id === id)!;
      facts.push(item.description ? { type: 'text', label: 'Details', value: item.description } : null);
      facts.push(openActivity(item.experienceId));
      break;
    }
    case 'references': {
      const item = knowledge.references.find((entry) => entry.id === id)!;
      facts.push(item.relationship ? { type: 'text', label: 'How they know you', value: item.relationship } : null);
      facts.push(item.email ? { type: 'link', label: 'Email', value: item.email, url: `mailto:${item.email}` } : null);
      facts.push(item.phone ? { type: 'link', label: 'Phone', value: item.phone, url: `tel:${item.phone.replace(/\s/g, '')}` } : null);
      facts.push(openActivity(item.experienceId));
      break;
    }
    case 'notes': {
      const item = knowledge.notes.find((entry) => entry.id === id)!;
      facts.push({ type: 'text', label: 'Last changed', value: formatMonth(item.updatedAt.slice(0, 10)) ?? '' });
      break;
    }
    case 'languages':
      break;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.head}>
        {isNote ? null : <Image source={{ uri: summary.icon }} style={styles.icon} contentFit="contain" transition={200} />}
        <ThemedText style={isNote ? styles.noteText : styles.title}>{summary.title}</ThemedText>
        {[summary.subtitle, summary.detail].some(Boolean) ? (
          <ThemedText themeColor="textSecondary">{[summary.subtitle, summary.detail].filter(Boolean).join(' · ')}</ThemedText>
        ) : null}
      </View>

      {facts.filter((fact): fact is Fact => fact !== null && !(fact.type === 'text' && !fact.value)).map((fact, index) => (
        <FactCard key={index} fact={fact} />
      ))}
    </ScrollView>
  );
}

function FactCard({ fact }: { fact: Fact }) {
  if (fact.type === 'link') {
    const onPress = fact.onPress ?? (fact.url ? () => void Linking.openURL(fact.url!) : undefined);
    return (
      <PressableScale pressedScale={0.98} haptic accessibilityRole="button" onPress={onPress} style={[styles.card, styles.linkCard]}>
        <View style={styles.flexText}>
          <ThemedText type="small" themeColor="textSecondary">
            {fact.label}
          </ThemedText>
          <ThemedText themeColor="olive" style={styles.linkValue}>
            {fact.value}
          </ThemedText>
        </View>
        <ThemedText themeColor="textMuted" style={styles.chevron}>
          ›
        </ThemedText>
      </PressableScale>
    );
  }
  return (
    <View style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {fact.label}
      </ThemedText>
      {fact.type === 'text' ? (
        <ThemedText style={styles.body}>{fact.value}</ThemedText>
      ) : (
        <View style={styles.chips}>
          {fact.values.map((value) => (
            <View key={value} style={styles.chip}>
              <ThemedText type="small">{value}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexText: { flex: 1, gap: 2 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two + Spacing.one,
  },
  head: { paddingHorizontal: Spacing.one, gap: Spacing.two, marginBottom: Spacing.two },
  icon: { width: 88, height: 88, marginLeft: -Spacing.one },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.15,
    letterSpacing: TITLE_SIZE * -0.03,
  },
  noteText: { fontSize: 19, lineHeight: 28, marginTop: Spacing.two },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.one,
  },
  body: { fontSize: 16, lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: { ...Shape.pill, backgroundColor: Colors.backgroundGrouped, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 1 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  linkValue: { fontFamily: Fonts.sansMedium },
  chevron: { fontSize: 26, lineHeight: 28 },
});
