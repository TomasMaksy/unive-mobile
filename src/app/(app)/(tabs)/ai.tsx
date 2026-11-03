import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { randomUUID } from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChatComposer } from '@/components/chat-composer';
import { MarkdownText } from '@/components/markdown-text';
import { ScreenHeader } from '@/components/screen-header';
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

  function send(text: string) {
    if (busy) return;
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
        renderItem={({ item, index }) => (
          <Message message={item} streaming={status === 'streaming' && index === visible.length - 1} />
        )}
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
        <ChatComposer
          busy={busy}
          onSend={send}
          onStop={stop}
          // The backend can't receive files from the app yet (see README).
          onAttach={() => Alert.alert('Coming soon', 'Sending photos and files to Unive AI is on its way.')}
        />
      </Animated.View>
    </ThemedView>
  );
}

function Message({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  const mine = message.role === 'user';
  // Tool cards (open a page, ask for input, …) are web-only for now; show the text.
  const text = message.parts
    .flatMap((p) => (p.type === 'text' ? [p.text] : []))
    .join('\n\n')
    .trim();

  // Like the website: your messages sit in a white pill, replies are formatted Markdown.
  return mine ? (
    <View style={[styles.bubble, styles.mine]}>
      <ThemedText selectable>{text}</ThemedText>
    </View>
  ) : (
    <View style={styles.theirs}>
      <MarkdownText streaming={streaming}>{text}</MarkdownText>
    </View>
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
    alignSelf: 'stretch',
  },
  thinking: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
  },
  composer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
