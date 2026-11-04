import { Host } from '@expo/ui';
import { Button, HStack, Image, List, RNHostView, Section, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  font,
  foregroundStyle,
  frame,
  kerning,
  listRowBackground,
  listStyle,
  multilineTextAlignment,
  padding,
  scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import { PressableScale } from '@/components/pressable-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import type { ProfileListProps } from '@/components/profile-list';
import { PROFILE_LINKS } from '@/components/profile-links';
import { Colors } from '@/constants/theme';

const NAME_SIZE = 32;

/**
 * The profile as a native grouped list, the same SwiftUI List iOS Settings
 * uses, laid out like Revolut's: your photo and name on top, inviting friends,
 * then the rest of Unive.
 */
export function ProfileList({
  name,
  email,
  imageUrl,
  uploadingPhoto,
  onEditPhoto,
  onInvite,
  onOpen,
  onSignOut,
}: ProfileListProps) {

  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <List modifiers={[listStyle('insetGrouped'), scrollContentBackground('hidden'), background(Colors.backgroundGrouped)]}>
        <Section modifiers={[listRowBackground('#00000000')]}>
          <VStack spacing={8} modifiers={[frame({ maxWidth: 10000 }), padding({ top: 36, bottom: 8 })]}>
            {/* Your picture is a React Native view (expo-image loads it), placed in the SwiftUI list. */}
            <RNHostView matchContents>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                pressedScale={0.94}
                haptic
                onPress={onEditPhoto}>
                <ProfileAvatar size={104} imageUrl={imageUrl} name={name || email} busy={uploadingPhoto} />
              </PressableScale>
            </RNHostView>
            <Text
              modifiers={[
                font({ family: 'AveriaSerifLibre-Regular', size: NAME_SIZE }),
                // The heading font's tight tracking, like the website's (-0.03em) and ThemedText's.
                kerning(NAME_SIZE * -0.03),
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
