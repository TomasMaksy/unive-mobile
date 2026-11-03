import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useAiPull } from '@/features/ai/ai-panel';

/** An empty tab: just the header, until the screen is built. */
export function PlaceholderScreen({ title }: { title: string }) {
  const onScroll = useAiPull();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* iOS pads this scroll view for the tab bar by itself. Pulling it down opens the AI. */}
        <Animated.ScrollView
          contentInsetAdjustmentBehavior="automatic"
          alwaysBounceVertical
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.container}>
          <ScreenHeader title={title} />
        </Animated.ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
