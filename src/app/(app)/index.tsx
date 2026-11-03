import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <ThemedText type="subtitle">Today</ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.spinner} />
          ) : error ? (
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
          ) : !plan ? (
            <ThemedText themeColor="textSecondary">No plan yet. Pull down to try again.</ThemedText>
          ) : plan.status === 'generating' ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <ThemedText themeColor="textSecondary">Putting together today’s plan…</ThemedText>
            </View>
          ) : plan.status === 'failed' ? (
            <>
              <ThemedText themeColor="textSecondary">We couldn’t build today’s plan.</ThemedText>
              {plan.canRetry && <Button label="Try again" onPress={retry} />}
            </>
          ) : (
            <>
              {plan.summary && <ThemedText themeColor="textSecondary">{plan.summary}</ThemedText>}
              {plan.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onPlanChange={setPlan} />
              ))}
              {plan.status === 'completed' && (
                <ThemedText themeColor="textSecondary">All done for today. Nice work.</ThemedText>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
    <ThemedView type="backgroundElement" style={[styles.card, resolved && styles.resolved]}>
      <Pressable onPress={() => setExpanded((value) => !value)} style={styles.cardHeader}>
        <ThemedText type="smallBold" style={task.status === 'completed' && styles.done}>
          {task.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[
            task.timing?.label,
            `${task.estimatedMinutes} min`,
            task.status === 'skipped' ? 'Skipped' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
        {isDeadline && task.timing?.date && (
          <ThemedText type="small" style={{ color: Accent }}>
            Deadline {task.timing.date}
            {task.timing.sourceLabel ? ` (${task.timing.sourceLabel})` : ''}
          </ThemedText>
        )}
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <ThemedText type="small">{task.whyNow}</ThemedText>
          {task.instructions.map((step, i) => (
            <ThemedText key={i} type="small" themeColor="textSecondary">
              {i + 1}. {step}
            </ThemedText>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Done when: {task.definitionOfDone}
          </ThemedText>
          {task.executionMode === 'in_unive' && (
            <ThemedText type="small" themeColor="textSecondary">
              This one happens on the unive website.
            </ThemedText>
          )}
        </View>
      )}

      {error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  spinner: {
    marginTop: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    gap: Spacing.one,
  },
  resolved: {
    opacity: 0.6,
  },
  done: {
    textDecorationLine: 'line-through',
  },
  details: {
    gap: Spacing.two,
  },
  error: {
    color: '#e5484d',
  },
});
