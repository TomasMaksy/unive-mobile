import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { KnowledgeForm } from '@/components/knowledge-form';
import { TextFieldRegistry, useTextFieldValues } from '@/components/native-text-field-types';
import { Colors } from '@/constants/theme';
import {
  type Academics,
  addItem,
  deleteItem,
  type Knowledge,
  type KnowledgeKind,
  saveAcademics,
  updateItem,
  useKnowledge,
} from '@/lib/knowledge';
import { type Draft, type DraftValue, findItem, FORMS, type FormSpec, isComplete } from '@/lib/knowledge-fields';

// Your test scores, edited together. Same ranges as the website's.
const ACADEMICS: FormSpec['sections'] = [
  {
    footer: 'Leave a score empty if you haven’t taken the test.',
    fields: [
      { key: 'gpa', label: 'GPA', type: 'text', keyboard: 'decimal-pad', placeholder: '0.00 – 4.00' },
      { key: 'actComposite', label: 'ACT', type: 'text', keyboard: 'numeric', placeholder: '1 – 36' },
      { key: 'satReading', label: 'SAT Reading & Writing', type: 'text', keyboard: 'numeric', placeholder: '200 – 800' },
      { key: 'satMath', label: 'SAT Math', type: 'text', keyboard: 'numeric', placeholder: '200 – 800' },
    ],
  },
];
const RANGES: Record<keyof Academics, [number, number]> = {
  gpa: [0, 4],
  actComposite: [1, 36],
  satReading: [200, 800],
  satMath: [200, 800],
};

function academicsDraft(academics: Academics): Draft {
  return Object.fromEntries(Object.entries(academics).map(([key, value]) => [key, value == null ? '' : String(value)]));
}

/** The scores as numbers, or null where one is out of range. */
function parseAcademics(draft: Draft): Academics | null {
  const result = {} as Academics;
  for (const key of Object.keys(RANGES) as (keyof Academics)[]) {
    const raw = typeof draft[key] === 'string' ? (draft[key] as string).trim().replace(',', '.') : '';
    if (!raw) {
      result[key] = null;
      continue;
    }
    const value = Number(raw);
    const [min, max] = RANGES[key];
    const whole = key !== 'gpa';
    if (!Number.isFinite(value) || value < min || value > max || (whole && !Number.isInteger(value))) return null;
    result[key] = key === 'gpa' ? Math.round(value * 100) / 100 : value;
  }
  return result;
}

/**
 * Adding or editing one item in the Knowledge Library (or your test scores),
 * as a sheet over the library, like adding a contact. Opened from the library.
 */
export default function KnowledgeEditScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: KnowledgeKind | 'academics'; id?: string }>();
  const knowledge = useKnowledge();
  if (!knowledge) return null;
  return kind === 'academics' ? <AcademicsSheet knowledge={knowledge} /> : <ItemSheet knowledge={knowledge} kind={kind} id={id} />;
}

function AcademicsSheet({ knowledge }: { knowledge: Knowledge }) {
  const router = useRouter();
  const before = knowledge.static.academics;
  const [draft, setDraft] = useState<Draft>(() => academicsDraft(before));
  const [saving, setSaving] = useState(false);
  const fields = useTextFieldValues();
  const parsed = parseAcademics(draft);

  async function save() {
    // The exact text in each field, including a last keystroke not yet reported.
    const latest = parseAcademics({ ...draft, ...fields.read() });
    if (!latest) return;
    setSaving(true);
    try {
      await saveAcademics(before, latest);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert("Couldn't save your scores", error instanceof Error ? error.message : 'Please try again.');
      setSaving(false);
    }
  }

  return (
    <>
      <SheetHeader title="Academics" canSave={parsed !== null && !saving} saving={saving} onSave={save} />
      <TextFieldRegistry value={fields.registry}>
        <KnowledgeForm sections={ACADEMICS} draft={draft} onChange={(key, value) => setDraft((d) => ({ ...d, [key]: value }))} activities={[]} />
      </TextFieldRegistry>
    </>
  );
}

function ItemSheet({ knowledge, kind, id }: { knowledge: Knowledge; kind: KnowledgeKind; id?: string }) {
  const router = useRouter();
  const spec = FORMS[kind];
  const item = id ? findItem(knowledge, kind, id) : undefined;
  const [draft, setDraft] = useState<Draft>(() => (item ? spec.toDraft(item as never) : { ...spec.empty }));
  const [saving, setSaving] = useState(false);
  const fields = useTextFieldValues();
  const activities = knowledge.experiences.map(({ id: activityId, title }) => ({ id: activityId, title }));

  function change(key: string, value: DraftValue) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      // The exact text in each field, including a last keystroke not yet reported.
      const payload = spec.toPayload({ ...draft, ...fields.read() });
      if (id) await updateItem(kind, id, payload);
      else await addItem(kind, payload);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert(`Couldn't save this ${spec.noun.toLowerCase()}`, error instanceof Error ? error.message : 'Please try again.');
      setSaving(false);
    }
  }

  function remove() {
    if (!id) return;
    Alert.alert(`Delete ${spec.noun.toLowerCase()}?`, 'The AI will no longer know about it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(kind, id);
            router.back();
          } catch {
            Alert.alert(`Couldn't delete this ${spec.noun.toLowerCase()}`, 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <>
      <SheetHeader
        title={id ? spec.noun : `New ${spec.noun}`}
        canSave={isComplete(spec, draft) && !saving}
        saving={saving}
        onSave={save}
      />
      <TextFieldRegistry value={fields.registry}>
        <KnowledgeForm
          sections={spec.sections}
          draft={draft}
          onChange={change}
          activities={activities}
          onDelete={id ? remove : undefined}
          deleteLabel={`Delete ${spec.noun}`}
        />
      </TextFieldRegistry>
    </>
  );
}

// The sheet's own bar: Cancel on the left, Save on the right, like Contacts.
function SheetHeader({ title, canSave, saving, onSave }: { title: string; canSave: boolean; saving: boolean; onSave: () => void }) {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>Cancel</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="prominent" tintColor={Colors.olive} disabled={!canSave} onPress={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
