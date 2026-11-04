import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { AboutFormProps } from '@/components/about-form-types';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { ACADEMICS_FORM } from '@/features/knowledge/academics';
import { needsUniversity, schoolLabel } from '@/features/knowledge/about';

export type { AboutFormProps } from '@/components/about-form-types';

/** Android and web: plain rows (iOS gets a native form, see about-form.ios.tsx). */
export function AboutForm({ draft, onChange, scores, onScoreChange, onPick, countryLabel, stateLabel }: AboutFormProps) {
  const rows: { label: string; value: string | null; onPress: () => void }[] = [
    { label: 'High school', value: schoolLabel(draft.highSchool), onPress: () => onPick('highSchool') },
    ...(needsUniversity(draft.stage) ? [{ label: 'University', value: schoolLabel(draft.university), onPress: () => onPick('university') }] : []),
    { label: 'Country', value: countryLabel, onPress: () => onPick('country') },
    ...(draft.country === 'US' ? [{ label: 'State', value: stateLabel, onPress: () => onPick('state') }] : []),
  ];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {rows.map((row) => (
        <Pressable key={row.label} onPress={row.onPress} style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {row.label}
          </ThemedText>
          <ThemedText>{row.value ?? 'Choose'}</ThemedText>
        </Pressable>
      ))}
      {ACADEMICS_FORM[0].fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {field.label}
          </ThemedText>
          <TextInput
            defaultValue={typeof scores[field.key] === 'string' ? (scores[field.key] as string) : ''}
            keyboardType="decimal-pad"
            onChangeText={(value) => onScoreChange(field.key, value)}
            style={styles.input}
          />
        </View>
      ))}
      {draft.interests.map((interest) => (
        <Pressable
          key={interest.cipCode}
          onPress={() => onChange({ ...draft, interests: draft.interests.filter((entry) => entry.cipCode !== interest.cipCode) })}>
          <ThemedText>{`${interest.name}  ✕`}</ThemedText>
        </Pressable>
      ))}
      <Pressable onPress={() => onPick('interest')}>
        <ThemedText themeColor="olive">Add study interest</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { backgroundColor: Colors.backgroundElement, borderRadius: 12, padding: Spacing.three, fontSize: 16, color: Colors.text },
});
