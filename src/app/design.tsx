import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  CardGroup,
  EmptyState,
  ErrorState,
  Field,
  Loader,
  Loading,
  Mark,
  Progress,
  Skeleton,
  SkeletonText,
  Text,
  Wordmark,
  type ButtonVariant,
} from '@/components/ui';
import { colors, type ColorRole, type TypeVariant, haptics, riseIn, screenPadding, shape, space } from '@/theme';

/**
 * The design system on one screen: every token and component in every
 * state, so you can check a change on a real phone. Development builds
 * only; open it with unive:///design. Not linked from anywhere in the app.
 */
export default function DesignScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}

const SWATCHES: ColorRole[] = [
  'background',
  'backgroundGrouped',
  'surface',
  'fill',
  'inverse',
  'text',
  'textSecondary',
  'textMuted',
  'accent',
  'accentSoft',
  'border',
  'success',
  'warning',
  'danger',
];

const TYPE: TypeVariant[] = ['display', 'h1', 'h2', 'h3', 'title', 'lead', 'headline', 'body', 'callout', 'small', 'label', 'caption', 'eyebrow'];

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'accent', 'ghost', 'destructive'];

function Gallery() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState(40);
  const [replay, setReplay] = useState(0);
  const [email, setEmail] = useState('');

  // Tap a button to start loading; tap another (or the same one again, in
  // the next second or so) to stop it.
  function press(id: string) {
    setLoading(id);
    setTimeout(() => {
      setLoading((current) => {
        if (current === id) haptics.success();
        return current === id ? null : current;
      });
    }, 8000);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[12], paddingBottom: insets.bottom + space[12] }]}>
      <Text variant="h2" accessibilityRole="header">
        Design system
      </Text>
      <Text variant="lead" color="textSecondary">
        Every token and component, in every state. Tap the buttons.
      </Text>

      <Section title="Logo">
        <Card style={styles.row}>
          <Wordmark height={32} />
          <Mark height={28} color={colors.accent} />
        </Card>
      </Section>

      <Section title="Colour roles">
        <View style={styles.swatches}>
          {SWATCHES.map((role) => (
            <View key={role} style={styles.swatch}>
              <View style={[styles.chip, { backgroundColor: colors[role] }]} />
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {role}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type">
        <Card style={styles.stack}>
          {TYPE.map((v) => (
            <View key={v}>
              <Text variant="caption" color="textMuted">
                {v}
              </Text>
              <Text variant={v} numberOfLines={1}>
                Plan every deadline
              </Text>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Buttons" note="Press and hold: it sinks and springs back. Tap: the label turns into the “un” for a few seconds.">
        <Card style={styles.stack}>
          {VARIANTS.map((v) => (
            <Button key={v} label={v[0].toUpperCase() + v.slice(1)} variant={v} loading={loading === v} onPress={() => press(v)} />
          ))}
          <Button
            label="Build my plan"
            variant="generating"
            loading={loading === 'generating'}
            loadingLabel="Generating…"
            onPress={() => press('generating')}
          />
          <Button label="Disabled" disabled />
          <View style={styles.row}>
            <Button label="Small" size="sm" variant="secondary" inline icon="plus" onPress={() => press('sm')} loading={loading === 'sm'} />
            <Button label="Medium" inline variant="outline" onPress={() => press('md')} loading={loading === 'md'} />
          </View>
          <Button label="Large call to action" size="lg" loading={loading === 'lg'} onPress={() => press('lg')} />
        </Card>
        <View style={[styles.inkPanel, styles.stack]}>
          <Text variant="label" color="textInverse">
            On ink or photos
          </Text>
          <Button label="Inverse" variant="inverse" loading={loading === 'inverse'} onPress={() => press('inverse')} />
        </View>
      </Section>

      <Section title="Fields">
        <Card style={styles.stack}>
          <Field label="Email" placeholder="you@school.edu" value={email} onChangeText={setEmail} hint="We’ll send you a code." />
          <Field label="Code" placeholder="000000" error="That code didn’t work. Try again." />
          <Field label="Disabled" placeholder="Can’t type here" disabled />
          <Field placeholder="Write a note…" multiline />
        </Card>
      </Section>

      <Section title="Cards" note="Raised on paper; flat inside a mist tray. Tap one.">
        <Card onPress={() => haptics.tick()} accessibilityLabel="Why Yale essay">
          <Text variant="eyebrow" color="textMuted">
            This week
          </Text>
          <Text variant="title" style={styles.gapTop}>
            Finish your “Why Yale” essay
          </Text>
          <Text variant="caption" color="textMuted" style={styles.gapTop}>
            Due Friday · 640 of 650 words
          </Text>
        </Card>
        <CardGroup>
          <Card tone="flat">
            <Text variant="headline">Common App</Text>
            <Text variant="caption" color="textMuted">
              7 sections · 10 min
            </Text>
          </Card>
          <Card tone="flat">
            <Text variant="headline">Scholarships</Text>
            <Text variant="caption" color="textMuted">
              3 due this month
            </Text>
          </Card>
        </CardGroup>
      </Section>

      <Section title="Badges">
        <View style={styles.row}>
          <Badge label="Draft" />
          <Badge label="Submitted" variant="success" />
          <Badge label="Due soon" variant="warning" />
          <Badge label="Overdue" variant="error" />
        </View>
      </Section>

      <Section title="Loaders" note="Flow for any wait; write for creation moments.">
        <Card style={styles.row}>
          <Loader size={16} />
          <Loader size={24} />
          <Loader size={40} color={colors.accent} />
          <Loader variant="write" size={40} />
        </Card>
        <Card style={styles.row}>
          <Loader size={20} color={colors.accent} accessibilityLabel="" />
          <Text variant="lead" color="textSecondary">
            Reading your essay…
          </Text>
        </Card>
      </Section>

      <Section title="Progress" note="A plain iOS bar in the brand colours.">
        <Card style={styles.stack}>
          <Progress label="Loading" showValue value={progress} />
          <Progress tone="ink" value={progress} />
          <View style={styles.row}>
            <Button label="−20" size="sm" variant="secondary" inline haptic={false} onPress={() => setProgress((p) => Math.max(0, p - 20))} />
            <Button label="+20" size="sm" variant="secondary" inline haptic={false} onPress={() => setProgress((p) => Math.min(100, p + 20))} />
          </View>
        </Card>
      </Section>

      <Section title="Skeletons">
        <Card style={styles.stack}>
          <View style={styles.row}>
            <Skeleton shape="circle" width={44} />
            <View style={styles.flex}>
              <SkeletonText lines={2} />
            </View>
          </View>
          <Skeleton shape="block" height={140} />
        </Card>
      </Section>

      <Section title="States">
        <Card>
          <Loading label="Building your plan…" variant="write" fill={false} />
        </Card>
        <Card>
          <ErrorState message="We couldn’t load your deadlines." onRetry={() => new Promise((r) => setTimeout(r, 1500))} fill={false} />
        </Card>
        <Card>
          <EmptyState
            title="No essays yet"
            message="Your drafts will show up here."
            action={<Button label="Start an essay" inline icon="plus" style={styles.centerSelf} />}
          />
        </Card>
      </Section>

      <Section title="Entrance" note="Rise and fade in, staggered 60 ms.">
        <View key={replay} style={styles.stack}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} entering={riseIn(i)}>
              <Card tone="flat">
                <Text variant="headline">Item {i + 1}</Text>
              </Card>
            </Animated.View>
          ))}
        </View>
        <Button label="Replay" variant="secondary" inline onPress={() => setReplay((r) => r + 1)} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {note && (
        <Text variant="small" color="textMuted">
          {note}
        </Text>
      )}
      <View style={styles.stack}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: screenPadding, gap: space[3] },
  section: { gap: space[2], marginTop: space[8] },
  stack: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[3] },
  flex: { flex: 1 },
  gapTop: { marginTop: space[1] },
  centerSelf: { alignSelf: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  swatch: { width: 76, gap: space[1] },
  chip: { ...shape.tile, height: 48, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  inkPanel: { ...shape.card, backgroundColor: colors.inverse, padding: space[4] },
});

