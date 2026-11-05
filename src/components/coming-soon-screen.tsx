import { ScrollView, StyleSheet } from 'react-native';

import { PageTitle } from '@/components/page-title';
import { Text } from '@/components/ui/text';
import { space } from '@/theme';

/** A screen that's in the app's navigation but not built yet. */
export function ComingSoonScreen({ title }: { title: string }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <PageTitle>{title}</PageTitle>
      <Text color="textSecondary">Coming soon to the app.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space[6],
    gap: space[4],
  },
});
