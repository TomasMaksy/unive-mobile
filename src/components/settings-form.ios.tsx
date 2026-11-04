import { Host } from '@expo/ui';
import {
  Button,
  DatePicker,
  HStack,
  Image,
  LabeledContent,
  List,
  Picker,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  background,
  disabled,
  font,
  foregroundStyle,
  kerning,
  keyboardType,
  listRowBackground,
  listRowInsets,
  listStyle,
  multilineTextAlignment,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tag,
  textContentType,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import { SETTINGS_COPY, type SettingsFormProps } from '@/components/settings-form-types';
import { Colors } from '@/constants/theme';
import { GENDERS, parseIsoDate, toIsoDate } from '@/lib/settings';

const NO_GENDER = 'none';
const TITLE_SIZE = 34;
// A birthday picker starts here when you add one: around a typical applicant's age.
const DEFAULT_BIRTHDAY = '2008-01-01';

/**
 * Settings as a native iOS form, like the Settings app: the website's sections
 * (src/app/dashboard/(sidebar)/(main)/settings in unive-v2) as grouped rows.
 */
export function SettingsForm({
  draft,
  onChange,
  email,
  onEditEmail,
  subscribed,
  calendar,
  calendarBusy,
  onLinkCalendar,
  onUnlinkCalendar,
  onOpenKnowledge,
  erasing,
  onErase,
}: SettingsFormProps) {
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
        {/* The page's title, in the list rather than a navigation bar (it scrolls away). */}
        <Section modifiers={[listRowBackground('#00000000'), listRowInsets({ leading: 4, trailing: 0, top: 0, bottom: 0 })]}>
          <Text
            modifiers={[
              font({ family: 'AveriaSerifLibre-Regular', size: TITLE_SIZE }),
              kerning(TITLE_SIZE * -0.03),
              foregroundStyle(Colors.text),
            ]}>
            Settings
          </Text>
        </Section>

        <Section title="Profile" footer={<Text>{SETTINGS_COPY.profileFooter}</Text>}>
          <Field
            label="First name"
            value={draft.name}
            onChange={(name) => onChange({ name })}
            modifiers={[textContentType('givenName')]}
          />
          <Field
            label="Last name"
            value={draft.lastName}
            onChange={(lastName) => onChange({ lastName })}
            modifiers={[textContentType('familyName')]}
          />
          {draft.birthDate ? (
            <DatePicker
              title="Birthday"
              selection={parseIsoDate(draft.birthDate)}
              displayedComponents={['date']}
              range={{ end: new Date() }}
              onDateChange={(date) => onChange({ birthDate: toIsoDate(date) })}
            />
          ) : (
            <Button label="Add Birthday" onPress={() => onChange({ birthDate: DEFAULT_BIRTHDAY })} />
          )}
          <Picker
            label="Gender"
            selection={draft.gender ?? NO_GENDER}
            onSelectionChange={(value: string) =>
              onChange({ gender: value === NO_GENDER ? null : (value as (typeof GENDERS)[number]['value']) })
            }>
            <Text modifiers={[tag(NO_GENDER)]}>Not set</Text>
            {GENDERS.map((gender) => (
              <Text key={gender.value} modifiers={[tag(gender.value)]}>
                {gender.label}
              </Text>
            ))}
          </Picker>
          <Field
            label="Phone"
            value={draft.phone ?? ''}
            placeholder="+1 555 123 4567"
            onChange={(phone) => onChange({ phone })}
            modifiers={[keyboardType('phone-pad'), textContentType('telephoneNumber')]}
          />
        </Section>

        <Section title="Account">
          <Button onPress={onEditEmail}>
            <HStack spacing={8}>
              <Text modifiers={[foregroundStyle(Colors.text)]}>Email</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(Colors.textSecondary)]}>{email}</Text>
              <Chevron />
            </HStack>
          </Button>
          {subscribed && (
            <LabeledContent label="Plan">
              <Text modifiers={[foregroundStyle(Colors.textSecondary)]}>Unive Pro</Text>
            </LabeledContent>
          )}
        </Section>
        {subscribed && (
          // A footer of its own, so it reads as part of Account without a link out (App Store rules).
          <Section footer={<Text>{SETTINGS_COPY.subscriptionFooter}</Text>}>{null}</Section>
        )}

        <Section
          title="Google Calendar"
          footer={
            <Text modifiers={calendar?.syncError ? [foregroundStyle(Colors.destructive)] : []}>
              {calendar?.syncError ?? (calendar?.linked ? SETTINGS_COPY.calendarLinked : SETTINGS_COPY.calendarUnlinked)}
            </Text>
          }>
          {calendar === null || calendarBusy ? (
            <HStack>
              <Text modifiers={[foregroundStyle(Colors.textSecondary)]}>Google Calendar</Text>
              <Spacer />
              <ProgressView />
            </HStack>
          ) : calendar.linked ? (
            <>
              <LabeledContent label="Google Calendar">
                <Text modifiers={[foregroundStyle(Colors.textSecondary)]}>Linked</Text>
              </LabeledContent>
              <Button role="destructive" label="Unlink Google Calendar" onPress={onUnlinkCalendar} />
            </>
          ) : (
            <Button label="Link Google Calendar" systemImage="calendar.badge.plus" onPress={onLinkCalendar} />
          )}
        </Section>

        <Section title="Knowledge & onboarding" footer={<Text>{SETTINGS_COPY.knowledgeFooter}</Text>}>
          <Button onPress={onOpenKnowledge}>
            <HStack>
              <Text modifiers={[foregroundStyle(Colors.text)]}>Knowledge Library</Text>
              <Spacer />
              <Chevron />
            </HStack>
          </Button>
          <HStack>
            <Text modifiers={[foregroundStyle(Colors.textMuted)]}>Redo onboarding</Text>
            <Spacer />
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textMuted)]}>Coming soon</Text>
          </HStack>
        </Section>

        <Section footer={<Text>{SETTINGS_COPY.eraseFooter}</Text>}>
          {erasing ? (
            <HStack>
              <Text modifiers={[foregroundStyle(Colors.textSecondary)]}>Erasing…</Text>
              <Spacer />
              <ProgressView />
            </HStack>
          ) : (
            <Button role="destructive" label="Erase Everything" onPress={onErase} modifiers={[disabled(erasing)]} />
          )}
        </Section>
      </List>
    </Host>
  );
}

// A labelled text field, like the Settings app's: label on the left, value on the right.
function Field({
  label,
  value,
  placeholder,
  onChange,
  modifiers = [],
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  modifiers?: NonNullable<Parameters<typeof TextField>[0]['modifiers']>;
}) {
  // The field keeps its own text natively (no flicker while typing); it starts from the saved value.
  const text = useNativeState(value);
  return (
    <LabeledContent label={label}>
      <TextField
        text={text}
        placeholder={placeholder ?? label}
        onTextChange={onChange}
        modifiers={[
          multilineTextAlignment('trailing'),
          foregroundStyle(Colors.textSecondary),
          autocorrectionDisabled(),
          textInputAutocapitalization('words'),
          ...modifiers,
        ]}
      />
    </LabeledContent>
  );
}

function Chevron() {
  return <Image systemName="chevron.right" modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(Colors.textMuted)]} />;
}
