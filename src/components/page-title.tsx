import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

export const PAGE_TITLE_SIZE = 34;

/**
 * A page's title, in the content rather than a navigation bar: it scrolls
 * away with the page. Averia with the website's tight tracking.
 */
export function PageTitle({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <ThemedText accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.heading,
    fontSize: PAGE_TITLE_SIZE,
    lineHeight: PAGE_TITLE_SIZE * 1.15,
    letterSpacing: PAGE_TITLE_SIZE * -0.03,
  },
});
