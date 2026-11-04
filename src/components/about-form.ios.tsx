import { Host } from '@expo/ui';
import { Button, HStack, Image, List, Picker, Section, Spacer, Text } from '@expo/ui/swift-ui';
import {
  background,
  font,
  foregroundStyle,
  lineLimit,
  listStyle,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import { type AboutFormProps, MAX_INTERESTS } from '@/components/about-form-types';
import { FieldRow } from '@/components/knowledge-form.ios';
import { Colors } from '@/constants/theme';
import { ACADEMICS_FORM } from '@/features/knowledge/academics';
import { needsUniversity, schoolLabel } from '@/features/knowledge/about';
import { EDUCATION_STAGES } from '@/lib/knowledge';

const NONE = 'none';

/** Editing About you as a native iOS form: rows that open a search, your scores, your interests. */
export function AboutForm({ draft, onChange, scores, onScoreChange, onPick, countryLabel, stateLabel }: AboutFormProps) {
  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <List
        modifiers={[
          listStyle('insetGrouped'),
          scrollContentBackground('hidden'),
          background(Colors.backgroundGrouped),
          scrollDismissesKeyboard('interactively'),
          tint(Colors.olive),
        ]}>
        <Section title="Education">
          <Picker
            label="Stage"
            selection={draft.stage ?? NONE}
            onSelectionChange={(stage: string) => onChange({ ...draft, stage: stage === NONE ? null : stage })}>
            {draft.stage ? null : <Text modifiers={[tag(NONE)]}>Choose</Text>}
            {Object.entries(EDUCATION_STAGES).map(([value, label]) => (
              <Text key={value} modifiers={[tag(value)]}>
                {label}
              </Text>
            ))}
          </Picker>
          <PickRow label="High school" value={schoolLabel(draft.highSchool)} onPress={() => onPick('highSchool')} />
          {needsUniversity(draft.stage) ? (
            <PickRow label="University" value={schoolLabel(draft.university)} onPress={() => onPick('university')} />
          ) : null}
        </Section>

        <Section title="Location">
          <PickRow label="Country" value={countryLabel} onPress={() => onPick('country')} />
          {draft.country === 'US' ? <PickRow label="State" value={stateLabel} onPress={() => onPick('state')} /> : null}
        </Section>

        <Section title="Scores" footer={<Text>{ACADEMICS_FORM[0].footer}</Text>}>
          {ACADEMICS_FORM[0].fields.map((field) => (
            <FieldRow key={field.key} field={field} value={scores[field.key] ?? null} onChange={(value) => onScoreChange(field.key, value)} activities={[]} />
          ))}
        </Section>

        <Section title="Study interests" footer={<Text>What you’d like to study. Unive uses these for programs, scholarships and advice.</Text>}>
          {draft.interests.map((interest) => (
            <HStack key={interest.cipCode} spacing={12}>
              {/* Like a list in edit mode: the red minus removes it. */}
              <Button
                onPress={() => onChange({ ...draft, interests: draft.interests.filter((entry) => entry.cipCode !== interest.cipCode) })}>
                <Image systemName="minus.circle.fill" modifiers={[font({ size: 20 }), foregroundStyle(Colors.destructive)]} />
              </Button>
              <Text modifiers={[foregroundStyle(Colors.text), lineLimit(2)]}>{interest.name}</Text>
              <Spacer />
            </HStack>
          ))}
          {draft.interests.length < MAX_INTERESTS ? (
            <Button onPress={() => onPick('interest')}>
              <HStack spacing={12}>
                <Image systemName="plus.circle.fill" modifiers={[font({ size: 20 }), foregroundStyle(Colors.olive)]} />
                <Text modifiers={[foregroundStyle(Colors.olive)]}>Add study interest</Text>
              </HStack>
            </Button>
          ) : null}
        </Section>
      </List>
    </Host>
  );
}

// A row that opens a search page: the label, what's chosen, and a chevron.
function PickRow({ label, value, onPress }: { label: string; value: string | null; onPress: () => void }) {
  return (
    <Button onPress={onPress}>
      <HStack spacing={8}>
        <Text modifiers={[foregroundStyle(Colors.text)]}>{label}</Text>
        <Spacer />
        <Text modifiers={[foregroundStyle(value ? Colors.textSecondary : Colors.textMuted), lineLimit(1)]}>{value ?? 'Choose'}</Text>
        <Image systemName="chevron.right" modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(Colors.textMuted)]} />
      </HStack>
    </Button>
  );
}
