import { useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, shape, space, type } from '@/theme';
import { formatScore, parseScore, saveScore, SCORES } from '@/features/knowledge/academics';
import type { ScoreSheetProps } from '@/features/knowledge/score-sheet-types';

export type { ScoreSheetProps } from '@/features/knowledge/score-sheet-types';

/** Android and web: a plain dialog to type the score (iOS gets a native sheet). */
export function ScoreSheet({ scoreKey, current, onClose }: ScoreSheetProps) {
  const field = SCORES.find((score) => score.key === scoreKey);
  const [text, setText] = useState('');
  if (!field || !scoreKey) return null;

  async function save() {
    const value = parseScore(scoreKey!, text);
    if (value === undefined) {
      Alert.alert(`Check your ${field!.label}`, `It goes from ${field!.min} to ${field!.max}.`);
      return;
    }
    await saveScore(scoreKey!, value).catch(() => Alert.alert("Couldn't save", 'Please try again.'));
    onClose();
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} onShow={() => setText(formatScore(scoreKey, current) ?? '')}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text variant="title">{field.label}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            keyboardType={field.keyboard}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            style={styles.input}
            autoFocus
          />
          <Button label="Save" variant="accent" size="lg" onPress={save} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop },
  sheet: {
    ...shape.panel,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: colors.surface,
    padding: space[6],
    gap: space[4],
  },
  // The score is the moment: Averia, large, like the iOS sheet.
  input: { ...type.h2, color: colors.text, borderBottomWidth: 1, borderColor: colors.border },
});
