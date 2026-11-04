import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
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
          <ThemedText type="smallBold">{field.label}</ThemedText>
          <TextInput value={text} onChangeText={setText} keyboardType={field.keyboard} style={styles.input} autoFocus />
          <Pressable onPress={save}>
            <ThemedText themeColor="olive">Save</ThemedText>
          </Pressable>
          <Pressable onPress={onClose}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: Colors.backgroundElement, padding: Spacing.four, gap: Spacing.three },
  input: { fontSize: 32, color: Colors.text, borderBottomWidth: 1, borderColor: Colors.border },
});
