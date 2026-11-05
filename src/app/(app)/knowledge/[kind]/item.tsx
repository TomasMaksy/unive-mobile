import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { KnowledgeForm } from '@/components/knowledge-form';
import { TextFieldRegistry, useTextFieldValues } from '@/components/native-text-field-types';
import { PressableScale, Text } from '@/components/ui';
import { colors, duration, easeUnive, haptics, pressScale, shape, space } from '@/theme';
import { confirmDelete } from '@/features/knowledge/delete';
import { SECTIONS, summaries } from '@/features/knowledge/sections';
import { addItem, formatMonth, type Knowledge, type KnowledgeKind, updateItem, useKnowledge } from '@/lib/knowledge';
import { type Draft, type DraftValue, findItem, FORMS, isComplete } from '@/lib/knowledge-fields';

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
    haptics.tick();
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
      haptics.success();
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
            <Stack.Toolbar.Button variant="prominent" tintColor={colors.accent} disabled={saving || !isComplete(spec, draft)} onPress={save}>
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
        <Animated.View key="edit" entering={enter} exiting={exit} style={styles.flex}>
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
        <Animated.View key="view" entering={enter} exiting={exit} style={styles.flex}>
          <ItemView knowledge={knowledge} kind={kind} id={id!} />
        </Animated.View>
      )}
    </>
  );
}

const enter = FadeIn.duration(duration.standard).easing(easeUnive);
const exit = FadeOut.duration(duration.quick);

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
        <Text variant={isNote ? 'lead' : 'h3'} style={isNote && styles.noteText}>
          {summary.title}
        </Text>
        {[summary.subtitle, summary.detail].some(Boolean) ? (
          <Text color="textSecondary">{[summary.subtitle, summary.detail].filter(Boolean).join(' · ')}</Text>
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
      <PressableScale pressedScale={pressScale.card} haptic accessibilityRole="button" onPress={onPress} style={[styles.card, styles.linkCard]}>
        <View style={styles.flexText}>
          <Text variant="small" color="textSecondary">
            {fact.label}
          </Text>
          <Text variant="headline" color="accent">
            {fact.value}
          </Text>
        </View>
        <SymbolView name="chevron.right" size={14} weight="semibold" tintColor={colors.textMuted} />
      </PressableScale>
    );
  }
  return (
    <View style={styles.card}>
      <Text variant="small" color="textSecondary">
        {fact.label}
      </Text>
      {fact.type === 'text' ? (
        <Text>{fact.value}</Text>
      ) : (
        <View style={styles.chips}>
          {fact.values.map((value) => (
            <View key={value} style={styles.chip}>
              <Text variant="small">{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexText: { flex: 1, gap: space[0.5] },
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[3],
  },
  head: { paddingHorizontal: space[1], gap: space[2], marginBottom: space[2] },
  icon: { width: 88, height: 88, marginLeft: -space[1] },
  noteText: { marginTop: space[2] },
  card: {
    ...shape.card,
    backgroundColor: colors.surface,
    padding: space[4],
    paddingHorizontal: space[5],
    gap: space[1],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[1] },
  chip: { ...shape.pill, backgroundColor: colors.backgroundGrouped, paddingHorizontal: space[4], paddingVertical: space[1.5] },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
