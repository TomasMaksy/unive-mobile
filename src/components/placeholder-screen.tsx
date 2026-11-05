import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { useAiPull } from '@/features/ai/ai-panel';
import { colors } from '@/theme';

/** An empty tab: just the header, until the screen is built. */
export function PlaceholderScreen({ title }: { title: string }) {
  const onScroll = useAiPull();

  return (
    <View style={[{ backgroundColor: colors.background }, styles.container]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
