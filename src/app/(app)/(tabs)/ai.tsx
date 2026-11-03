import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { randomUUID } from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Shape, Spacing } from '@/constants/theme';
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
  // The app-wide safe area only knows about the notch and the home indicator.
  // A provider inside the tab measures this screen itself, which on iOS
  // includes the tab bar floating over its bottom edge.
  return (
    <SafeAreaProvider>
      <Chat />
    </SafeAreaProvider>
  );
}

function Chat() {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  // Sit above the tab bar, or above the keyboard while it's open (it covers
  // the tab bar). Runs on the UI thread, so it follows the keyboard smoothly.
  const composerStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value, insets.bottom) + Spacing.two,
  }));
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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="AI"
        right={
          messages.length > 0 && (
            <Button
              label="New chat"
              variant="secondary"
              disabled={busy}
              onPress={() => setChatId(randomUUID())}
            />
          )
        }
      />

      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        // The composer already keeps clear of the tab bar; iOS shouldn't pad the list for it too.
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        // Keep the newest message in view when the keyboard opens and the list shrinks.
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
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

      <Animated.View style={[styles.composer, composerStyle]}>
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
      </Animated.View>
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
  list: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  bubble: {
    ...Shape.bubble,
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
    // Squircle rather than a pill, so it still looks right when it grows to several lines.
    ...Shape.bubble,
    flex: 1,
    maxHeight: 140,
    paddingTop: 13,
    paddingBottom: 13,
  },
});
