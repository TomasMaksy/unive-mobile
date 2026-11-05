import { Host } from '@expo/ui';
import { Button, HStack, Image, Menu, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  menuOrder,
  menuStyle,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { SIZE } from '@/components/icon-button.ios';
import { colors } from '@/theme';
import type { GuideContentsProps } from '@/features/guide/guide-contents-types';

const glass = isLiquidGlassAvailable();

/**
 * The guide's contents, out of the way until you need them: a glass pill
 * naming the section you're in. Tap it for a native menu of every section.
 */
export function GuideContents({ sections, currentId, onSelect }: GuideContentsProps) {
  const current = sections.find((section) => section.id === currentId) ?? sections[0];
  const position = Math.max(0, sections.indexOf(current)) + 1;

  return (
    <Host matchContents ignoreSafeArea="all">
      <Menu
        modifiers={[
          menuStyle('button'),
          buttonStyle(glass ? 'glass' : 'bordered'),
          buttonBorderShape('capsule'),
          controlSize('regular'),
          frame({ height: SIZE }),
          menuOrder('fixed'),
          accessibilityLabel('Contents'),
        ]}
        label={
          <HStack spacing={6}>
            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(colors.textMuted)]}>
              {`${position}/${sections.length}`}
            </Text>
            <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(colors.text), lineLimit(1), frame({ maxWidth: 190 })]}>
              {current?.title ?? ''}
            </Text>
            <Image systemName="chevron.up.chevron.down" modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(colors.textSecondary)]} />
          </HStack>
        }>
        {sections.map((section) => (
          <Button
            key={section.id}
            label={section.title}
            systemImage={section.id === current?.id ? 'checkmark' : undefined}
            onPress={() => onSelect(section.id)}
          />
        ))}
      </Menu>
    </Host>
  );
}
