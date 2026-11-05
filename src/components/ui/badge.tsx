import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, shape } from '@/theme';

/**
 * Status at a glance: a small capsule, a soft fill and the state's ink for
 * text. Four looks, no more. No outlines and no solid fills: a solid
 * capsule reads as a button.
 *
 *   neutral  a plain label, a type, a stage (and "info")
 *   success  done, accepted, submitted
 *   warning  needs doing soon
 *   error    missing, overdue, failed
 */
const variants = {
  neutral: { bg: colors.fill, fg: 'textSecondary' },
  success: { bg: colors.successSoft, fg: 'successText' },
  warning: { bg: colors.warningSoft, fg: 'warningText' },
  error: { bg: colors.dangerSoft, fg: 'dangerText' },
} as const;

export function Badge({
  label,
  variant = 'neutral',
  style,
}: {
  label: string;
  variant?: keyof typeof variants;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variants[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text variant="label" color={v.fg} numberOfLines={1} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { ...shape.pill, alignSelf: 'flex-start', minHeight: 24, paddingHorizontal: 10, justifyContent: 'center' },
  text: { fontSize: 12, lineHeight: 16 },
});
