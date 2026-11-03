import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { randomUUID } from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/chat-composer';
import { IconButton } from '@/components/icon-button';
import { MarkdownText } from '@/components/markdown-text';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Shape, Spacing } from '@/constants/theme';
import { ChatActions } from '@/features/ai/chat-actions';
import { authHeaders } from '@/lib/api';
import { API_URL, authClient } from '@/lib/auth-client';
import { fetchChatHistory, fetchChatMessages, type ChatSummary } from '@/lib/chat-history';

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

// Unive's olive (Colors.olive), at the strength the glow under the input starts from.
const GLOW = 'rgba(111, 118, 68, 0.3)';
const CLEAR = 'rgba(111, 118, 68, 0)';

type AiChatProps = {
  /** The panel is on screen: a good moment to pick up chats started on the website. */
  isOpen: boolean;
  onClose: () => void;
  /** Dragging the header up closes the panel the chat lives in (see ai-panel.tsx). */
  headerGesture: PanGesture;
  /** ...and so does grabbing the input and dragging it up. */
  composerGesture: PanGesture;
};

/**
 * The unive AI chat. It lives in the panel you pull down from the top of any
 * tab, which covers the whole screen, so the app-wide safe area applies.
 */
export function AiChat({ isOpen, onClose, headerGesture, composerGesture }: AiChatProps) {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  // Sit above the home indicator, or above the keyboard while it's open.
  // Runs on the UI thread, so it follows the keyboard smoothly.
  const composerStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value, insets.bottom) + Spacing.two,
  }));
  // The olive glow rises from just under the composer, so it rides up with the keyboard too.
  const glowStyle = useAnimatedStyle(() => ({
    bottom: keyboard.height.value,
  }));
  // Without the keyboard it's strongest at the bottom of the screen. With it, it fades out
  // before the keyboard instead: iOS 26 paints its own backdrop around the keyboard, so olive
  // right down to it would end in a hard line there.
  const keyboardShown = useAnimatedStyle(() => ({
    opacity: interpolate(keyboard.height.value, [0, 120], [0, 1], Extrapolation.CLAMP),
  }));
  const keyboardHidden = useAnimatedStyle(() => ({
    opacity: interpolate(keyboard.height.value, [0, 120], [1, 0], Extrapolation.CLAMP),
  }));
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name?.trim().split(/\s+/)[0];
  // A new chat starts empty; an old one starts with what's already been said.
  const [chat, setChat] = useState<{ id: string; messages: UIMessage[] }>(() => ({ id: randomUUID(), messages: [] }));
  const [openingChat, setOpeningChat] = useState(false);
  const [history, setHistory] = useState<ChatSummary[]>([]);
  const listRef = useRef<FlatList<UIMessage>>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chat.id,
    messages: chat.messages,
    transport,
    // unive-v2 requires UUID message ids.
    generateId: randomUUID,
  });
  const busy = status === 'submitted' || status === 'streaming';

  // The glow is for the empty chat: it slowly dissolves once the first message goes,
  // and comes back for a new chat.
  const empty = messages.length === 0;
  const glowFadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(empty ? 1 : 0, { duration: 900, easing: Easing.out(Easing.quad) }),
  }));

  // The chat list comes from the backend, so it's the same as the website's.
  // Refresh it when the panel opens and once each reply has finished (the new
  // chat, or its title, shows up then).
  useEffect(() => {
    if (!isOpen || busy) return;
    let current = true;
    fetchChatHistory()
      .then((chats) => current && setHistory(chats))
      .catch(() => {}); // Keep the list we have; the menu still works.
    return () => {
      current = false;
    };
  }, [isOpen, busy]);

  function startNewChat() {
    if (busy) stop();
    setChat({ id: randomUUID(), messages: [] });
  }

  async function openChat(chatId: string) {
    if (chatId === chat.id) return;
    if (busy) stop();
    setOpeningChat(true);
    try {
      // useChat only reads `messages` when the id changes, so switch once they're here.
      setChat({ id: chatId, messages: await fetchChatMessages(chatId) });
    } catch {
      Alert.alert("Couldn't open that chat", 'Check your connection and try again.');
    } finally {
      setOpeningChat(false);
    }
  }

  // While an old chat loads, clear the screen for its spinner.
  const visible = useMemo(
    () => (openingChat ? [] : messages.filter((m) => m.parts.some((p) => p.type === 'text' && p.text.trim()))),
    [messages, openingChat],
  );

  function send(text: string) {
    if (busy) return;
    sendMessage({ text, metadata: { createdAt: new Date().toISOString() } });
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <GestureDetector gesture={headerGesture}>
        <View>
          <ScreenHeader
            left={<IconButton systemImage="chevron.up" accessibilityLabel="Close AI" onPress={onClose} />}
            right={
              <ChatActions
                canStartNew={messages.length > 0}
                onNewChat={startNewChat}
                history={history}
                currentChatId={chat.id}
                onOpenChat={openChat}
              />
            }
          />
        </View>
      </GestureDetector>

      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, visible.length === 0 && styles.listEmpty]}
        // The composer keeps clear of the bottom edge; iOS shouldn't pad the list for it too.
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        // Keep the newest message in view when the keyboard opens and the list shrinks.
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            {openingChat ? (
              <ActivityIndicator color={Colors.textSecondary} />
            ) : (
              <ThemedText type="title" style={styles.greeting}>
                {firstName ? (
                  <>
                    What&apos;s up <Text style={styles.name}>{firstName}</Text>?
                  </>
                ) : (
                  "What's up?"
                )}
              </ThemedText>
            )}
          </View>
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

      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle, glowFadeStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowToEdge, keyboardHidden]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowAboveKeyboard, keyboardShown]} />
      </Animated.View>
      <GestureDetector gesture={composerGesture}>
        <Animated.View style={[styles.composer, composerStyle]}>
          <ChatComposer
            // Opening the AI goes straight to typing, keyboard up.
            autoFocus={isOpen}
            busy={busy}
            onSend={send}
            onStop={stop}
            // The backend can't receive files from the app yet (see README).
            onAttach={() => Alert.alert('Coming soon', 'Sending photos and files to Unive AI is on its way.')}
          />
        </Animated.View>
      </GestureDetector>
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

  // Your messages sit in a white pill like the input, replies are formatted Markdown.
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
  },
  listEmpty: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    textAlign: 'center',
  },
  name: {
    color: Colors.olive,
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
  // The same olive as the pull-down gradient (ai-panel.tsx), here coming up from the bottom.
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 260,
  },
  glowToEdge: {
    experimental_backgroundImage: `linear-gradient(0deg, ${GLOW}, ${CLEAR})`,
  },
  // Clear at the keyboard, strongest behind the input, clear again higher up.
  glowAboveKeyboard: {
    experimental_backgroundImage: `linear-gradient(0deg, ${CLEAR}, ${GLOW} 40%, ${CLEAR})`,
  },
  composer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
