import { Alert, StyleSheet } from 'react-native';

import { PressableScale, Text } from '@/components/ui';
import { colors, pressScale, shape, space } from '@/theme';
import type { GuideContentsProps } from '@/features/guide/guide-contents-types';

/** Android and web: a pill naming the section; tap it to pick another. iOS: guide-contents.ios.tsx. */
export function GuideContents({ sections, currentId, onSelect }: GuideContentsProps) {
  const current = sections.find((section) => section.id === currentId) ?? sections[0];
  return (
    <PressableScale
      pressedScale={pressScale.button}
      accessibilityRole="button"
      accessibilityLabel="Contents"
      onPress={() =>
        Alert.alert('Contents', undefined, [
          ...sections.map((section) => ({ text: section.title, onPress: () => onSelect(section.id) })),
          { text: 'Cancel', style: 'cancel' as const },
        ])
      }
      style={styles.pill}>
      <Text variant="label" numberOfLines={1}>
        {current?.title ?? ''}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...shape.pill,
    height: 44,
    maxWidth: 240,
    justifyContent: 'center',
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
  },
});
