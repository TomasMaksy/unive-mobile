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
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  background,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  kerning,
  keyboardType,
  listRowBackground,
  listRowInsets,
  listStyle,
  multilineTextAlignment,
  scrollContentBackground,
  scrollDismissesKeyboard,
  submitLabel,
  tag,
  textContentType,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import { formRow } from '@/components/native-form';
import { NativeTextField } from '@/components/native-text-field';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SETTINGS_COPY, type SettingsFormProps } from '@/components/settings-form-types';
import { colors } from '@/theme';
import { GENDERS, parseIsoDate, toIsoDate } from '@/lib/settings';

const NO_GENDER = 'none';
const TITLE_SIZE = 34;
const PHOTO_SIZE = 96;
// A birthday picker starts here when you add one: around a typical applicant's age.
const DEFAULT_BIRTHDAY = '2008-01-01';

/**
 * Settings as a native iOS form, like the Settings app: the website's sections
 * (src/app/dashboard/(sidebar)/(main)/settings in unive-v2) as grouped rows.
 */
export function SettingsForm({
  name,
  imageUrl,
  uploadingPhoto,
  onEditPhoto,
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
          background(colors.backgroundGrouped),
          scrollDismissesKeyboard('interactively'),
          tint(colors.accent),
        ]}>
        {/* The page's title, in the list rather than a navigation bar (it scrolls away): the h2 step, Averia Light. */}
        <Section modifiers={[listRowBackground(colors.transparent), listRowInsets({ leading: 4, trailing: 0, top: 0, bottom: 0 })]}>
          <Text
            modifiers={[
              font({ family: 'AveriaSerifLibre-Light', size: TITLE_SIZE }),
              kerning(TITLE_SIZE * -0.03),
              foregroundStyle(colors.text),
            ]}>
            Settings
          </Text>
        </Section>

        {/* Your picture, like editing a contact: tap it (or Edit) to change it. */}
        <Section modifiers={[listRowBackground(colors.transparent)]}>
          <VStack spacing={10} modifiers={[frame({ maxWidth: 10000 })]}>
            <RNHostView matchContents>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                pressedScale={0.94}
                haptic
                onPress={onEditPhoto}>
                <ProfileAvatar size={PHOTO_SIZE} imageUrl={imageUrl} name={name} busy={uploadingPhoto} />
              </PressableScale>
            </RNHostView>
            {/* Borderless, so only the word is the button: a plain one makes the whole row tappable. */}
            <Button onPress={onEditPhoto} modifiers={[buttonStyle('borderless')]}>
              <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(colors.accent)]}>
                {imageUrl ? 'Edit' : 'Add Photo'}
              </Text>
            </Button>
          </VStack>
        </Section>

        <Section title="Profile" footer={<Text>{SETTINGS_COPY.profileFooter}</Text>}>
          <Field
            name="name"
            label="First name"
            value={draft.name}
            onChange={(name) => onChange({ name })}
            modifiers={[textContentType('givenName')]}
          />
          <Field
            name="lastName"
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
              modifiers={formRow}
            />
          ) : (
            <Button label="Add Birthday" onPress={() => onChange({ birthDate: DEFAULT_BIRTHDAY })} modifiers={formRow} />
          )}
          <Picker
            label="Gender"
            modifiers={formRow}
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
            name="phone"
            label="Phone"
            value={draft.phone ?? ''}
            placeholder="+1 555 123 4567"
            onChange={(phone) => onChange({ phone })}
            // Not the phone pad: it has no return key, so the keyboard couldn't be put away. This one has + and a Done key.
            modifiers={[keyboardType('numbers-and-punctuation'), textContentType('telephoneNumber')]}
          />
        </Section>

        <Section title="Account">
          <Button onPress={onEditEmail} modifiers={formRow}>
            <HStack spacing={8}>
              <Text modifiers={[foregroundStyle(colors.text)]}>Email</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>{email}</Text>
              <Chevron />
            </HStack>
          </Button>
          {subscribed && (
            <LabeledContent label="Plan" modifiers={formRow}>
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>Unive Pro</Text>
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
            <Text modifiers={calendar?.syncError ? [foregroundStyle(colors.dangerText)] : []}>
              {calendar?.syncError ?? (calendar?.linked ? SETTINGS_COPY.calendarLinked : SETTINGS_COPY.calendarUnlinked)}
            </Text>
          }>
          {calendar === null || calendarBusy ? (
            <HStack modifiers={formRow}>
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>Google Calendar</Text>
              <Spacer />
              <ProgressView />
            </HStack>
          ) : calendar.linked ? (
            <>
              <LabeledContent label="Google Calendar" modifiers={formRow}>
                <Text modifiers={[foregroundStyle(colors.textSecondary)]}>Linked</Text>
              </LabeledContent>
              <Button role="destructive" label="Unlink Google Calendar" onPress={onUnlinkCalendar} modifiers={formRow} />
            </>
          ) : (
            <Button label="Link Google Calendar" systemImage="calendar.badge.plus" onPress={onLinkCalendar} modifiers={formRow} />
          )}
        </Section>

        <Section title="Knowledge & onboarding" footer={<Text>{SETTINGS_COPY.knowledgeFooter}</Text>}>
          <Button onPress={onOpenKnowledge} modifiers={formRow}>
            <HStack>
              <Text modifiers={[foregroundStyle(colors.text)]}>Knowledge Library</Text>
              <Spacer />
              <Chevron />
            </HStack>
          </Button>
          <HStack modifiers={formRow}>
            <Text modifiers={[foregroundStyle(colors.textMuted)]}>Redo onboarding</Text>
            <Spacer />
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(colors.textMuted)]}>Coming soon</Text>
          </HStack>
        </Section>

        <Section footer={<Text>{SETTINGS_COPY.eraseFooter}</Text>}>
          {erasing ? (
            <HStack modifiers={formRow}>
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>Erasing…</Text>
              <Spacer />
              <ProgressView />
            </HStack>
          ) : (
            <Button role="destructive" label="Erase Everything" onPress={onErase} modifiers={[...formRow, disabled(erasing)]} />
          )}
        </Section>
      </List>
    </Host>
  );
}

// A labelled text field, like the Settings app's: label on the left, value on the right.
function Field({
  name,
  label,
  value,
  placeholder,
  onChange,
  modifiers = [],
}: {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  modifiers?: NonNullable<Parameters<typeof NativeTextField>[0]['modifiers']>;
}) {
  return (
    <LabeledContent label={label} modifiers={formRow}>
      <NativeTextField
        name={name}
        initialText={value}
        placeholder={placeholder ?? label}
        onTextChange={onChange}
        modifiers={[
          multilineTextAlignment('trailing'),
          foregroundStyle(colors.textSecondary),
          autocorrectionDisabled(),
          textInputAutocapitalization('words'),
          submitLabel('done'),
          ...modifiers,
        ]}
      />
    </LabeledContent>
  );
}

function Chevron() {
  return <Image systemName="chevron.right" modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(colors.textMuted)]} />;
}
