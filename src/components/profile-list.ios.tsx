import { Host } from '@expo/ui';
import { Button, HStack, Image, LabeledContent, List, Section, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listStyle,
  multilineTextAlignment,
  padding,
  scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { ProfileListProps } from '@/components/profile-list';
import { PROFILE_LINKS } from '@/components/profile-links';
import { Colors } from '@/constants/theme';

/**
 * The profile as a native grouped list, the same SwiftUI List iOS Settings
 * uses, laid out like Revolut's: your photo and name on top, inviting friends,
 * then the rest of Unive.
 */
export function ProfileList({ name, email, backend, onInvite, onOpen, onSignOut }: ProfileListProps) {
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();

  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <List modifiers={[listStyle('insetGrouped'), scrollContentBackground('hidden'), background(Colors.background)]}>
        <Section modifiers={[listRowBackground('#00000000')]}>
          <VStack spacing={8} modifiers={[frame({ maxWidth: 10000 }), padding({ top: 36, bottom: 8 })]}>
            <ZStack
              modifiers={[
                frame({ width: 104, height: 104 }),
                background(Colors.backgroundSelected),
                clipShape('circle'),
              ]}>
              <Text modifiers={[font({ size: 42, weight: 'semibold' }), foregroundStyle(Colors.text)]}>{initial}</Text>
            </ZStack>
            <Text
              modifiers={[
                font({ family: 'AveriaSerifLibre-Regular', size: 32 }),
                foregroundStyle(Colors.text),
                multilineTextAlignment('center'),
                padding({ top: 8 }),
              ]}>
              {name}
            </Text>
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary), multilineTextAlignment('center')]}>
              {email}
            </Text>
          </VStack>
        </Section>

        <Section>
          <Row systemImage="gift.fill" title="Invite friends" subtitle="Earn $150+" tint={Colors.olive} onPress={onInvite} />
        </Section>

        <Section>
          {PROFILE_LINKS.map((link) => (
            <Row key={link.screen} systemImage={link.systemImage} title={link.title} onPress={() => onOpen(link.screen)} />
          ))}
        </Section>

        {backend ? (
          <Section title="Development">
            <LabeledContent label="Backend">
              <Text>{backend}</Text>
            </LabeledContent>
          </Section>
        ) : null}

        <Section>
          <Button role="destructive" label="Sign out" onPress={onSignOut} />
        </Section>
      </List>
    </Host>
  );
}

// A tappable row like Settings': icon, title (and a line under it), chevron. Inside a
// List, a Button gets the system's own row highlight when pressed.
function Row({
  systemImage,
  title,
  subtitle,
  tint = Colors.text,
  onPress,
}: {
  systemImage: SFSymbol;
  title: string;
  subtitle?: string;
  tint?: string;
  onPress: () => void;
}) {
  return (
    <Button onPress={onPress}>
      <HStack spacing={14} modifiers={[padding({ vertical: 6 })]}>
        <Image systemName={systemImage} modifiers={[font({ size: 20 }), foregroundStyle(tint), frame({ width: 28 })]} />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ textStyle: 'body' }), foregroundStyle(Colors.text)]}>{title}</Text>
          {subtitle ? (
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary)]}>{subtitle}</Text>
          ) : null}
        </VStack>
        <Spacer />
        <Image systemName="chevron.right" modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(Colors.textMuted)]} />
      </HStack>
    </Button>
  );
}
