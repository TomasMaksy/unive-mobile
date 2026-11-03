import { Host } from '@expo/ui';
import { Button, Image, Menu } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  menuOrder,
  menuStyle,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { IconButton } from '@/components/icon-button';
import { Colors, Spacing } from '@/constants/theme';
import type { ChatActionsProps } from '@/features/ai/chat-actions';

const glass = isLiquidGlassAvailable();

/**
 * Top right of the AI chat: a menu with your chat history (shared with the
 * website), joined by a new chat button once the chat has messages.
 */
export function ChatActions({ canStartNew, onNewChat, history, currentChatId, onOpenChat }: ChatActionsProps) {
  return (
    <View style={styles.row}>
      {canStartNew && (
        <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut.duration(150)}>
          <IconButton systemImage="square.and.pencil" accessibilityLabel="New chat" onPress={onNewChat} />
        </Animated.View>
      )}

      {/* Slides over when the new chat button appears or goes. */}
      <Animated.View layout={LinearTransition.springify()} entering={FadeIn} exiting={FadeOut}>
        {/* Same 44pt glass circle as IconButton, but it opens a native menu. */}
        <Host matchContents ignoreSafeArea="all">
          <Menu
            modifiers={[
              menuStyle('button'),
              buttonStyle(glass ? 'glass' : 'bordered'),
              buttonBorderShape('circle'),
              controlSize('regular'),
              menuOrder('fixed'),
              accessibilityLabel('Chat history'),
            ]}
            label={
              <Image
                systemName="line.3.horizontal"
                modifiers={[
                  font({ size: 17, weight: 'medium' }),
                  foregroundStyle(Colors.text),
                  frame({ width: 30, height: 30 }),
                ]}
              />
            }>
            {history.length === 0 ? (
              <Button label="No chats yet" />
            ) : (
              history.map((chat) => (
                <Button
                  key={chat.id}
                  label={chat.title?.trim() || 'Untitled chat'}
                  systemImage={chat.id === currentChatId ? 'checkmark' : undefined}
                  onPress={() => onOpenChat(chat.id)}
                />
              ))
            )}
          </Menu>
        </Host>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
