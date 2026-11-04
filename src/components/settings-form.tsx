import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SETTINGS_COPY, type SettingsFormProps } from '@/components/settings-form-types';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { GENDERS } from '@/lib/settings';

export type { SettingsFormProps } from '@/components/settings-form-types';

/** Settings outside iOS: plain rows (iOS gets SwiftUI's form, see settings-form.ios.tsx). */
export function SettingsForm(props: SettingsFormProps) {
  const { draft, onChange, calendar } = props;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
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
              <ThemedText themeColor={draft.gender === gender.value ? 'olive' : 'textSecondary'}>{gender.label}</ThemedText>
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
      {title ? <ThemedText type="small" themeColor="textSecondary">{title}</ThemedText> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <ThemedText type="small" themeColor="textSecondary">{footer}</ThemedText> : null}
    </View>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      defaultValue={value}
      placeholder={label}
      placeholderTextColor={Colors.textMuted}
      onChangeText={onChange}
      style={styles.input}
    />
  );
}

function Row({ label, destructive, onPress }: { label: string; destructive?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.input}>
      <ThemedText themeColor={destructive ? 'destructive' : 'text'}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.four },
  group: { gap: Spacing.two },
  card: { backgroundColor: Colors.backgroundElement, borderRadius: 16, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.three },
  input: { paddingVertical: Spacing.three, color: Colors.text, fontSize: 16 },
});
