import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import type { KnowledgeFormProps } from '@/components/knowledge-form-types';
import { Button, Field, Text } from '@/components/ui';
import { colors, space } from '@/theme';

export type { KnowledgeFormProps } from '@/components/knowledge-form-types';

/** Android and web: plain fields (iOS gets a native form, see knowledge-form.ios.tsx). */
export function KnowledgeForm({ sections, draft, onChange, onDelete, deleteLabel }: KnowledgeFormProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {sections.flatMap((section) => section.fields).map((field) =>
        field.type === 'toggle' ? (
          <View key={field.key} style={styles.toggle}>
            <Text variant="label" color="textSecondary" style={styles.flex}>
              {field.label}
            </Text>
            <Switch
              value={draft[field.key] === true}
              trackColor={{ true: colors.accent }}
              onValueChange={(value) => onChange(field.key, value)}
            />
          </View>
        ) : (
          <Field
            key={field.key}
            label={field.label}
            defaultValue={typeof draft[field.key] === 'string' ? (draft[field.key] as string) : ''}
            placeholder={field.type === 'month' ? 'YYYY-MM' : field.label}
            multiline={field.type === 'multiline'}
            onChangeText={(value) => onChange(field.key, value || null)}
          />
        ),
      )}
      {onDelete ? <Button label={deleteLabel ?? 'Delete'} variant="destructive" style={styles.delete} onPress={onDelete} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[6], gap: space[4] },
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingHorizontal: space[4] },
  delete: { marginTop: space[4] },
});
