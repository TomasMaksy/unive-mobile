// Not in the app for now: the website doesn't show the action plan yet.
// To bring it back, add a route in src/app/(app) that renders this screen
// and a tab for it in src/components/app-tabs.tsx.
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, ErrorState, Loading, PressableScale, Text } from '@/components/ui';
import { colors, space } from '@/theme';
import { fetchCurrentPlan, type Plan, requestPlan, resolveTask, type Task } from '@/lib/action-plan';

const POLL_INTERVAL_MS = 2_500;

export default function TodayScreen() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetchCurrentPlan()
        .then(async (current) => setPlan(current ?? (await requestPlan())))
        .then(() => setError(null))
        .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your plan.')),
    [],
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // A new plan takes a while to generate; check back until it's ready.
  useEffect(() => {
    if (plan?.status !== 'generating') return;
    const timer = setTimeout(() => {
      fetchCurrentPlan()
        .then(setPlan)
        .catch(() => setPlan({ ...plan }));
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [plan]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function retry() {
    setLoading(true);
    try {
      setPlan(await requestPlan());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start a new plan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
          <Text variant="h3">Today</Text>

          {loading ? (
            <Loading fill={false} style={styles.wait} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} fill={false} />
          ) : !plan ? (
            <Text color="textSecondary">No plan yet. Pull down to try again.</Text>
          ) : plan.status === 'generating' ? (
            <Loading label="Putting together today’s plan…" variant="write" fill={false} style={styles.wait} />
          ) : plan.status === 'failed' ? (
            <ErrorState
              title="We couldn’t build today’s plan"
              onRetry={plan.canRetry ? retry : undefined}
              fill={false}
            />
          ) : (
            <>
              {plan.summary && <Text color="textSecondary">{plan.summary}</Text>}
              {plan.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onPlanChange={setPlan} />
              ))}
              {plan.status === 'completed' && (
                <Text color="textSecondary">All done for today. Nice work.</Text>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TaskCard({ task, onPlanChange }: { task: Task; onPlanChange: (plan: Plan | null) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState<'completed' | 'skipped' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolved = task.status !== 'open';
  const isDeadline = task.timing?.kind === 'verified_deadline';

  async function resolve(status: 'completed' | 'skipped') {
    setSaving(status);
    setError(null);
    try {
      onPlanChange(await resolveTask(task.id, status, status === 'skipped' ? 'cant_do_now' : undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the task.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card style={[styles.card, resolved && styles.resolved]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.cardHeader}>
        <Text variant="headline" style={task.status === 'completed' && styles.done}>
          {task.title}
        </Text>
        <Text variant="small" color="textSecondary">
          {[
            task.timing?.label,
            `${task.estimatedMinutes} min`,
            task.status === 'skipped' ? 'Skipped' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {isDeadline && task.timing?.date && (
          <Text variant="small" color="accent">
            Deadline {task.timing.date}
            {task.timing.sourceLabel ? ` (${task.timing.sourceLabel})` : ''}
          </Text>
        )}
      </PressableScale>

      {expanded && (
        <View style={styles.details}>
          <Text variant="small">{task.whyNow}</Text>
          {task.instructions.map((step, i) => (
            <Text key={i} variant="small" color="textSecondary">
              {i + 1}. {step}
            </Text>
          ))}
          <Text variant="small" color="textSecondary">
            Done when: {task.definitionOfDone}
          </Text>
          {task.executionMode === 'in_unive' && (
            <Text variant="small" color="textSecondary">
              This one happens on the Unive website.
            </Text>
          )}
        </View>
      )}

      {error && (
        <Text variant="small" color="dangerText">
          {error}
        </Text>
      )}

      {!resolved && (
        <View style={styles.row}>
          <Button
            label="Done"
            style={styles.flex}
            loading={saving === 'completed'}
            disabled={!!saving}
            onPress={() => resolve('completed')}
          />
          <Button
            label="Skip"
            variant="secondary"
            style={styles.flex}
            loading={saving === 'skipped'}
            disabled={!!saving}
            onPress={() => resolve('skipped')}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    gap: space[4],
    // iOS adds the tab bar's height below this list by itself (automatic content insets).
    padding: space[6],
  },
  wait: {
    marginTop: space[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: space[4],
  },
  cardHeader: {
    gap: space[1],
  },
  resolved: {
    opacity: 0.6,
  },
  done: {
    textDecorationLine: 'line-through',
  },
  details: {
    gap: space[2],
  },
});
