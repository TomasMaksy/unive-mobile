import { ScrollView, StyleSheet } from 'react-native';

import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** A screen that's in the app's navigation but not built yet. */
export function ComingSoonScreen({ title }: { title: string }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <PageTitle>{title}</PageTitle>
      <ThemedText themeColor="textSecondary">Coming soon to the app.</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
