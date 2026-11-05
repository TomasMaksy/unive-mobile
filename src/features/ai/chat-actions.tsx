import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { IconButton } from '@/components/icon-button';
import { space } from '@/theme';
import type { ChatSummary } from '@/lib/chat-history';

export type ChatActionsProps = {
  /** The chat has messages, so starting a new one makes sense. */
  canStartNew: boolean;
  onNewChat: () => void;
  history: ChatSummary[];
  currentChatId: string;
  onOpenChat: (chatId: string) => void;
};

/**
 * Android and web fallback: just the new chat button. On iOS,
 * chat-actions.ios.tsx adds the native chat history menu.
 */
export function ChatActions({ canStartNew, onNewChat }: ChatActionsProps) {
  return (
    <View style={styles.row}>
      {canStartNew && (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <IconButton systemImage="square.and.pencil" accessibilityLabel="New chat" onPress={onNewChat} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space[2],
  },
});
