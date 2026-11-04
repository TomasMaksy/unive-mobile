import { Host } from '@expo/ui';
import {
  Button,
  DatePicker,
  HStack,
  Image,
  LabeledContent,
  List,
  Picker,
  Section,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  background,
  font,
  foregroundStyle,
  keyboardType,
  lineLimit,
  listStyle,
  multilineTextAlignment,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tag,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import type { KnowledgeFormProps } from '@/components/knowledge-form-types';
import { NativeTextField } from '@/components/native-text-field';
import { Colors } from '@/constants/theme';
import { isoToDate, toYearMonth } from '@/lib/knowledge';
import type { DraftValue, Field } from '@/lib/knowledge-fields';

const NONE = 'none';

/** Adding or editing a Knowledge Library item, as a native iOS form. */
export function KnowledgeForm({ sections, draft, onChange, activities, onDelete, deleteLabel }: KnowledgeFormProps) {
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
        {sections.map((section, index) => {
          const fields = section.fields.filter((field) => !(field.type === 'month' && field.hiddenWhen && draft[field.hiddenWhen]));
          return (
            <Section
              // Sections never reorder.
              key={index}
              title={section.title}
              footer={section.footer ? <Text>{section.footer}</Text> : undefined}>
              {fields.map((field) => (
                <FieldRow key={field.key} field={field} value={draft[field.key] ?? null} onChange={(value) => onChange(field.key, value)} activities={activities} />
              ))}
            </Section>
          );
        })}
        {onDelete ? (
          <Section>
            <Button role="destructive" label={deleteLabel ?? 'Delete'} onPress={onDelete} />
          </Section>
        ) : null}
      </List>
    </Host>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  activities,
}: {
  field: Field;
  value: DraftValue;
  onChange: (value: DraftValue) => void;
  activities: KnowledgeFormProps['activities'];
}) {
  switch (field.type) {
    case 'text':
      return (
        <LabeledContent label={field.label}>
          <NativeText
            name={field.key}
            initial={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder ?? field.label}
            onChange={onChange}
            keyboard={field.keyboard}
          />
        </LabeledContent>
      );
    case 'multiline':
      return (
        <NativeText name={field.key} initial={typeof value === 'string' ? value : ''} placeholder={field.placeholder ?? field.label} onChange={onChange} multiline />
      );
    case 'choice':
      return (
        <Picker label={field.label} selection={typeof value === 'string' ? value : NONE} onSelectionChange={(next: string) => onChange(next === NONE ? null : next)}>
          {field.optional ? <Text modifiers={[tag(NONE)]}>Not set</Text> : null}
          {field.options.map((option) => (
            <Text key={option.value} modifiers={[tag(option.value)]}>
              {option.label}
            </Text>
          ))}
        </Picker>
      );
    case 'activity':
      return (
        <Picker label={field.label} selection={typeof value === 'string' ? value : NONE} onSelectionChange={(next: string) => onChange(next === NONE ? null : next)}>
          <Text modifiers={[tag(NONE)]}>None</Text>
          {activities.map((activity) => (
            <Text key={activity.id} modifiers={[tag(activity.id)]}>
              {activity.title}
            </Text>
          ))}
        </Picker>
      );
    case 'toggle':
      return <Toggle label={field.label} isOn={value === true} onIsOnChange={onChange} />;
    case 'month':
      // Empty until you add one; a month is enough, like the website's.
      return typeof value === 'string' ? (
        <HStack spacing={8}>
          <DatePicker
            title={field.label}
            selection={isoToDate(value)}
            displayedComponents={['date']}
            range={{ end: new Date() }}
            onDateChange={(date) => onChange(toYearMonth(date))}
          />
          {field.required ? null : (
            <Button onPress={() => onChange(null)}>
              <Image systemName="xmark.circle.fill" modifiers={[font({ size: 18 }), foregroundStyle(Colors.textMuted)]} />
            </Button>
          )}
        </HStack>
      ) : (
        <Button onPress={() => onChange(toYearMonth(new Date()))}>
          <HStack spacing={10}>
            <Image systemName="calendar.badge.plus" modifiers={[font({ size: 17 }), foregroundStyle(Colors.olive)]} />
            <Text modifiers={[foregroundStyle(Colors.olive)]}>{`Add ${field.label.toLowerCase()} date`}</Text>
          </HStack>
        </Button>
      );
  }
}

function NativeText({
  name,
  initial,
  placeholder,
  onChange,
  keyboard,
  multiline,
}: {
  name: string;
  initial: string;
  placeholder: string;
  onChange: (value: string) => void;
  keyboard?: 'email-address' | 'phone-pad' | 'decimal-pad' | 'numeric';
  multiline?: boolean;
}) {
  return (
    <NativeTextField
      name={name}
      initialText={initial}
      placeholder={placeholder}
      onTextChange={onChange}
      axis={multiline ? 'vertical' : 'horizontal'}
      modifiers={[
        ...(multiline
          ? [lineLimit({ min: 4, max: 12 })]
          : [multilineTextAlignment('trailing'), foregroundStyle(Colors.textSecondary)]),
        ...(keyboard ? [keyboardType(keyboard), autocorrectionDisabled(), textInputAutocapitalization('never')] : []),
      ]}
    />
  );
}
