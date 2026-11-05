import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { SETTINGS_COPY, type SettingsFormProps } from '@/components/settings-form-types';
import { Text } from '@/components/ui/text';
import { colors, shape, space, type } from '@/theme';
import { GENDERS } from '@/lib/settings';

export type { SettingsFormProps } from '@/components/settings-form-types';

/** Settings outside iOS: plain rows (iOS gets SwiftUI's form, see settings-form.ios.tsx). */
export function SettingsForm(props: SettingsFormProps) {
  const { draft, onChange, calendar } = props;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Pressable onPress={props.onEditPhoto} style={styles.photo} accessibilityRole="button" accessibilityLabel="Change profile picture">
        <ProfileAvatar size={96} imageUrl={props.imageUrl} name={props.name} busy={props.uploadingPhoto} />
        <Text variant="label" color="accent">
          {props.imageUrl ? 'Edit' : 'Add Photo'}
        </Text>
      </Pressable>
      <Group title="Profile" footer={SETTINGS_COPY.profileFooter}>
        <Field label="First name" value={draft.name} onChange={(name) => onChange({ name })} />
        <Field label="Last name" value={draft.lastName} onChange={(lastName) => onChange({ lastName })} />
        <Field
          label="Birthday (YYYY-MM-DD)"
          value={draft.birthDate ?? ''}
          onChange={(value) => onChange({ birthDate: /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null })}
        />
        <View style={styles.row}>
          {GENDERS.map((gender) => (
            <Pressable key={gender.value} onPress={() => onChange({ gender: draft.gender === gender.value ? null : gender.value })}>
              <Text color={draft.gender === gender.value ? 'accent' : 'textSecondary'}>{gender.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Phone" value={draft.phone ?? ''} onChange={(phone) => onChange({ phone })} />
      </Group>
      <Group title="Account" footer={props.subscribed ? SETTINGS_COPY.subscriptionFooter : undefined}>
        <Row label={`Email · ${props.email}`} onPress={props.onEditEmail} />
      </Group>
      <Group title="Google Calendar" footer={calendar?.linked ? SETTINGS_COPY.calendarLinked : SETTINGS_COPY.calendarUnlinked}>
        {calendar?.linked ? (
          <Row label="Unlink Google Calendar" destructive onPress={props.onUnlinkCalendar} />
        ) : (
          <Row label="Link Google Calendar" onPress={props.onLinkCalendar} />
        )}
      </Group>
      <Group title="Knowledge & onboarding" footer={SETTINGS_COPY.knowledgeFooter}>
        <Row label="Knowledge Library" onPress={props.onOpenKnowledge} />
      </Group>
      <Group footer={SETTINGS_COPY.eraseFooter}>
        <Row label={props.erasing ? 'Erasing…' : 'Erase Everything'} destructive onPress={props.onErase} />
      </Group>
    </ScrollView>
  );
}

function Group({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? <Text variant="small" color="textSecondary">{title}</Text> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <Text variant="small" color="textSecondary">{footer}</Text> : null}
    </View>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      defaultValue={value}
      placeholder={label}
      placeholderTextColor={colors.textMuted}
      onChangeText={onChange}
      style={styles.input}
    />
  );
}

function Row({ label, destructive, onPress }: { label: string; destructive?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.rowItem}>
      <Text color={destructive ? 'dangerText' : 'text'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[6], gap: space[6] },
  photo: { alignItems: 'center', gap: space[2] },
  group: { gap: space[2] },
  card: { ...shape.card, backgroundColor: colors.surface, paddingHorizontal: space[4] },
  row: { flexDirection: 'row', gap: space[4], paddingVertical: space[4] },
  input: { ...type.body, paddingVertical: space[4], color: colors.text },
  rowItem: { paddingVertical: space[4] },
});
