import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { Shape, Spacing } from '@/constants/theme';

export type AttachmentSource = 'camera' | 'photos' | 'files';

export type ChatComposerProps = {
  /** A reply is on its way: the send button becomes stop. */
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onAttach: (source: AttachmentSource) => void;
};

/**
 * Android and web fallback: a plain input and a send button. On iOS,
 * chat-composer.ios.tsx renders the SwiftUI composer instead.
 */
export function ChatComposer({ busy, onSend, onStop }: ChatComposerProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !busy;

  return (
    <View style={styles.row}>
      <TextField style={styles.input} placeholder="Ask Unive" multiline value={text} onChangeText={setText} />
      {busy ? (
        <Button label="Stop" variant="secondary" inline onPress={onStop} />
      ) : (
        <Button
          label="Send"
          inline
          disabled={!canSend}
          onPress={() => {
            onSend(text.trim());
            setText('');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    ...Shape.bubble,
    flex: 1,
    maxHeight: 140,
  },
});
