import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { randomUUID } from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, Radius, Spacing } from '@/constants/theme';
import { authHeaders } from '@/lib/api';
import { API_URL } from '@/lib/auth-client';

// Same request the web app's global chat sends (unive-v22/src/features/chat/utils/create-chat.ts):
// the server stores the conversation, so only the newest message goes up.
const transport = new DefaultChatTransport<UIMessage>({
  api: `${API_URL}/api/chat`,
  // expo/fetch streams the reply; React Native's fetch would wait for all of it.
  fetch: expoFetch as unknown as typeof globalThis.fetch,
  prepareSendMessagesRequest: async ({ id, messages }) => ({
    credentials: 'omit',
    headers: await authHeaders(),
    body: { chatId: id, messages: messages.slice(-1), agent: 'global' },
  }),
});

export default function ChatScreen() {
  const [chatId, setChatId] = useState(randomUUID);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<UIMessage>>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    transport,
    // unive-v2 requires UUID message ids.
    generateId: randomUUID,
  });
  const busy = status === 'submitted' || status === 'streaming';

  const visible = useMemo(
    () => messages.filter((m) => m.parts.some((p) => p.type === 'text' && p.text.trim())),
    [messages],
  );

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMessage({ text, metadata: { createdAt: new Date().toISOString() } });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Chat</ThemedText>
          {messages.length > 0 && (
            <Button
              label="New chat"
              variant="secondary"
              disabled={busy}
              onPress={() => setChatId(randomUUID())}
            />
          )}
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={BottomTabInset}>
          <FlatList
            ref={listRef}
            data={visible}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary">
                Ask anything about your applications, essays or deadlines.
              </ThemedText>
            }
            renderItem={({ item }) => <Message message={item} />}
            ListFooterComponent={
              <>
                {status === 'submitted' && <ActivityIndicator color={Colors.textSecondary} style={styles.thinking} />}
                {error && (
                  <ThemedText type="small" themeColor="destructive" style={styles.error}>
                    {error.message || 'Something went wrong. Try again.'}
                  </ThemedText>
                )}
              </>
            }
          />

          <View style={[styles.composer, { paddingBottom: BottomTabInset + Spacing.two }]}>
            <TextField
              style={styles.input}
              placeholder="Message Unive"
              multiline
              value={input}
              onChangeText={setInput}
            />
            {busy ? (
              <Button label="Stop" variant="secondary" onPress={stop} />
            ) : (
              <Button label="Send" disabled={!input.trim()} onPress={send} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Message({ message }: { message: UIMessage }) {
  const mine = message.role === 'user';
  // Tool cards (open a page, ask for input, …) are web-only for now; show the text.
  const text = message.parts
    .flatMap((p) => (p.type === 'text' ? [p.text] : []))
    .join('\n\n')
    .trim();

  // Like the website: your messages sit in a white pill, replies are plain text.
  return mine ? (
    <View style={[styles.bubble, styles.mine]}>
      <ThemedText>{text}</ThemedText>
    </View>
  ) : (
    <ThemedText style={styles.theirs}>{text}</ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  list: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  bubble: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: '85%',
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  theirs: {
    alignSelf: 'flex-start',
  },
  thinking: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    maxHeight: 140,
    paddingTop: 13,
    paddingBottom: 13,
  },
});
