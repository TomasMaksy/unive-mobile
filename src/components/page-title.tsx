import type { StyleProp, TextStyle } from 'react-native';

import { Text } from '@/components/ui';

/**
 * A page's title, in the content rather than a navigation bar: it scrolls
 * away with the page (no top bars). The `h2` step of the type scale.
 */
export function PageTitle({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text variant="h2" accessibilityRole="header" style={style}>
      {children}
    </Text>
  );
}
