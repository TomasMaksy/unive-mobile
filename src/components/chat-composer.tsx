import {
  Button,
  GlassEffectContainer,
  HStack,
  Host,
  Image,
  Menu,
  Spacer,
  TextField,
  VStack,
  type TextFieldRef,
} from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  background,
  buttonBorderShape,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  lineLimit,
  menuOrder,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRef, useState } from 'react';

import { Colors } from '@/constants/theme';

export type AttachmentSource = 'camera' | 'photos' | 'files';

type ChatComposerProps = {
  /** A reply is on its way: the send button becomes stop. */
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onAttach: (source: AttachmentSource) => void;
};

const CORNER_RADIUS = 26;
// Liquid Glass needs iOS 26; older iOS gets a plain white surface instead.
const hasGlass = isLiquidGlassAvailable();

/**
 * The AI chat's input, built from Apple's own SwiftUI views (via @expo/ui),
 * like ChatGPT's: a glass pill with +, the text and send. While typing it
 * springs open into a taller box, the text on top and the buttons below.
 */
export function ChatComposer({ busy, onSend, onStop, onAttach }: ChatComposerProps) {
  const textRef = useRef<TextFieldRef>(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const canSend = text.trim().length > 0 && !busy;

  function send() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    textRef.current?.clear();
  }

  const plus = (
    <Menu
      // Keep Camera on top; by default iOS puts the first item nearest the button.
      modifiers={[menuOrder('fixed')]}
      label={
        <Image
          systemName="plus"
          modifiers={[font({ size: 20, weight: 'medium' }), foregroundStyle(Colors.text), frame({ width: 36, height: 36 })]}
        />
      }>
      <Button label="Camera" systemImage="camera" onPress={() => onAttach('camera')} />
      <Button label="Photos" systemImage="photo.on.rectangle" onPress={() => onAttach('photos')} />
      <Button label="Files" systemImage="paperclip" onPress={() => onAttach('files')} />
    </Menu>
  );

  const action = (
    <Button
      onPress={busy ? onStop : send}
      modifiers={[
        buttonStyle('borderedProminent'),
        buttonBorderShape('circle'),
        tint(Colors.text),
        disabled(!busy && !canSend),
      ]}>
      <Image
        systemName={busy ? 'stop.fill' : 'arrow.up'}
        modifiers={[font({ size: 15, weight: 'bold' }), frame({ width: 20, height: 20 })]}
      />
    </Button>
  );

  const surface = hasGlass
    ? glassEffect({
        glass: { variant: 'regular', interactive: true },
        shape: focused ? 'roundedRectangle' : 'capsule',
        cornerRadius: CORNER_RADIUS,
      })
    : background(
        Colors.backgroundElement,
        focused
          ? shapes.roundedRectangle({ cornerRadius: CORNER_RADIUS, roundedCornerStyle: 'continuous' })
          : shapes.capsule(),
      );

  return (
    <Host matchContents={{ vertical: true }} colorScheme="light" style={{ width: '100%' }}>
      <GlassEffectContainer>
        <VStack
          alignment="leading"
          spacing={6}
          modifiers={[
            padding({ horizontal: 8, vertical: 6 }),
            surface,
            // Every layout change caused by focusing springs, like the system's own controls.
            animation(Animation.bouncy(), focused),
          ]}>
          <HStack spacing={4} alignment="center">
            {!focused && plus}
            <TextField
              ref={textRef}
              axis="vertical"
              placeholder="Ask Unive"
              onTextChange={setText}
              onFocusChange={setFocused}
              modifiers={[
                lineLimit({ min: 1, max: 6 }),
                font({ textStyle: 'body' }),
                padding({ horizontal: focused ? 8 : 4, vertical: 8 }),
              ]}
            />
            {!focused && (busy || canSend) && action}
          </HStack>
          {focused && (
            <HStack>
              {plus}
              <Spacer />
              {action}
            </HStack>
          )}
        </VStack>
      </GlassEffectContainer>
    </Host>
  );
}
