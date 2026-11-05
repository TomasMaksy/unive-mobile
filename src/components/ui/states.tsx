import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Text } from '@/components/ui/text';
import { colors, duration, easeUnive, space } from '@/theme';

/**
 * A wait with no known shape: the "un" flowing, centred, with an optional
 * line in the brand's voice ("Reading your essay…"). It stays invisible for
 * the first 300ms, so a fast load never flashes a loader.
 *
 * Every screen that fetches has four states: loading, error, empty and
 * content. Lists and cards whose layout you know load with <Skeleton />
 * instead; full-screen waits use this.
 */
export function Loading({
  label,
  variant = 'flow',
  fill = true,
  style,
}: {
  label?: string;
  /** write: for creation moments, like generating a plan. */
  variant?: 'flow' | 'write';
  /** Take up the whole screen and centre. */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.center, fill && styles.fill, style]}>
      {visible && (
        <Animated.View entering={FadeIn.duration(duration.standard).easing(easeUnive)} style={styles.stack}>
          <Loader variant={variant} size={28} color={colors.textMuted} accessibilityLabel={label ?? 'Loading'} />
          {label && (
            <Text variant="lead" color="textSecondary" align="center">
              {label}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Something went wrong: say what, plainly, and offer the way out. Use the
 * server's message when it's written for people.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  fill = true,
  style,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [retrying, setRetrying] = useState(false);
  return (
    <View style={[styles.center, fill && styles.fill, style]}>
      <Animated.View entering={FadeIn.duration(duration.standard).easing(easeUnive)} style={styles.stack}>
        <Text variant="title" align="center">
          {title}
        </Text>
        {message && (
          <Text variant="callout" color="textSecondary" align="center">
            {message}
          </Text>
        )}
        {onRetry && (
          <Button
            label={retryLabel}
            variant="secondary"
            inline
            loading={retrying}
            style={styles.retry}
            onPress={async () => {
              setRetrying(true);
              try {
                await onRetry();
              } finally {
                setRetrying(false);
              }
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

/** Nothing here yet: a short title, one line on what will appear, and the action that adds it. */
export function EmptyState({
  title,
  message,
  action,
  style,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.center, styles.empty, style]}>
      <Text variant="title" align="center">
        {title}
      </Text>
      {message && (
        <Text variant="callout" color="textSecondary" align="center">
          {message}
        </Text>
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: space[6] },
  stack: { alignItems: 'center', gap: space[3], maxWidth: 320 },
  retry: { alignSelf: 'center', marginTop: space[2] },
  empty: { gap: space[3], paddingVertical: space[12] },
});
