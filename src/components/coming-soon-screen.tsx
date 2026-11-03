import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/**
 * A screen that's in the app's navigation but not built yet. Its title comes
 * from the native header (see src/app/(app)/_layout.tsx).
 */
export function ComingSoonScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <ThemedText themeColor="textSecondary">Coming soon to the app.</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
  },
});
