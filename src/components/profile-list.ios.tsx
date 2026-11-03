import { Host } from '@expo/ui';
import { Button, LabeledContent, List, Section, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listStyle,
  multilineTextAlignment,
  scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers';

import type { ProfileListProps } from '@/components/profile-list';
import { Colors } from '@/constants/theme';

/**
 * The profile as a native grouped list, the same SwiftUI List iOS Settings
 * uses: a large avatar on top, then rows grouped into white cards.
 */
export function ProfileList({ name, email, backend, onSignOut }: ProfileListProps) {
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();

  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <List modifiers={[listStyle('insetGrouped'), scrollContentBackground('hidden'), background(Colors.background)]}>
        <Section modifiers={[listRowBackground('#00000000')]}>
          <VStack spacing={6} modifiers={[frame({ maxWidth: 10000 })]}>
            <ZStack
              modifiers={[
                frame({ width: 88, height: 88 }),
                background(Colors.backgroundSelected),
                clipShape('circle'),
              ]}>
              <Text modifiers={[font({ size: 36, weight: 'semibold' }), foregroundStyle(Colors.text)]}>{initial}</Text>
            </ZStack>
            <Text modifiers={[font({ size: 22, weight: 'semibold' }), foregroundStyle(Colors.text)]}>{name}</Text>
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary), multilineTextAlignment('center')]}>
              {email}
            </Text>
          </VStack>
        </Section>

        <Section title="Account">
          <LabeledContent label="Name">
            <Text>{name}</Text>
          </LabeledContent>
          <LabeledContent label="Email">
            <Text>{email}</Text>
          </LabeledContent>
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
