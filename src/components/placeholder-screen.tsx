import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';

/** An empty tab: just the header, until the screen is built. */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* iOS pads this scroll view for the tab bar by itself. */}
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <ScreenHeader title={title} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
