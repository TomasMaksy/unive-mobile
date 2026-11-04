import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import type { KnowledgeFormProps } from '@/components/knowledge-form-types';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export type { KnowledgeFormProps } from '@/components/knowledge-form-types';

/** Android and web: plain fields (iOS gets a native form, see knowledge-form.ios.tsx). */
export function KnowledgeForm({ sections, draft, onChange, onDelete, deleteLabel }: KnowledgeFormProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {sections.flatMap((section) => section.fields).map((field) => (
        <View key={field.key} style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {field.label}
          </ThemedText>
          {field.type === 'toggle' ? (
            <Switch value={draft[field.key] === true} onValueChange={(value) => onChange(field.key, value)} />
          ) : (
            <TextInput
              defaultValue={typeof draft[field.key] === 'string' ? (draft[field.key] as string) : ''}
              placeholder={field.type === 'month' ? 'YYYY-MM' : field.label}
              multiline={field.type === 'multiline'}
              onChangeText={(value) => onChange(field.key, value || null)}
              style={styles.input}
            />
          )}
        </View>
      ))}
      {onDelete ? (
        <Pressable onPress={onDelete}>
          <ThemedText themeColor="destructive">{deleteLabel ?? 'Delete'}</ThemedText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { backgroundColor: Colors.backgroundElement, borderRadius: 12, padding: Spacing.three, fontSize: 16, color: Colors.text },
});
