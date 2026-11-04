import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import type { GuideContentsProps } from '@/features/guide/guide-contents-types';

/** Android and web: a pill naming the section; tap it to pick another. iOS: guide-contents.ios.tsx. */
export function GuideContents({ sections, currentId, onSelect }: GuideContentsProps) {
  const current = sections.find((section) => section.id === currentId) ?? sections[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Contents"
      onPress={() =>
        Alert.alert('Contents', undefined, [
          ...sections.map((section) => ({ text: section.title, onPress: () => onSelect(section.id) })),
          { text: 'Cancel', style: 'cancel' as const },
        ])
      }
      style={styles.pill}>
      <Text style={styles.label} numberOfLines={1}>
        {current?.title ?? ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...Shape.pill,
    height: 44,
    maxWidth: 240,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.backgroundElement,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.text,
  },
});
