import { apiFetch } from '@/lib/api';

// Mirrors the response types in
// unive-v22/src/features/admissions-action-plan/serialize.ts and types.ts.

export type TaskStatus = 'open' | 'completed' | 'skipped';
export type PlanStatus = 'generating' | 'active' | 'completed' | 'failed';
export type SkipReason = 'already_done' | 'not_relevant' | 'cant_do_now' | 'other';

export type TaskTiming = {
  kind: 'today' | 'recommended' | 'verified_deadline';
  label: string;
  date: string | null;
  sourceLabel: string | null;
};

export type Task = {
  id: string;
  position: number;
  title: string;
  whyNow: string;
  instructions: string[];
  definitionOfDone: string;
  category: string;
  executionMode: 'in_unive' | 'outside_unive';
  estimatedMinutes: number;
  timing: TaskTiming | null;
  status: TaskStatus;
  skipReason: SkipReason | null;
};

export type Plan = {
  id: string;
  planDate: string;
  status: PlanStatus;
  summary: string | null;
  canRetry: boolean;
  tasks: Task[];
};

type PlanEnvelope = { plan: Plan | null };

export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export async function fetchCurrentPlan(): Promise<Plan | null> {
  const { plan } = await apiFetch<PlanEnvelope>(
    `/api/admissions/action-plan?timeZone=${encodeURIComponent(timeZone)}`,
  );
  return plan;
}

/** Starts generating today's plan, or returns it if one already exists. */
export async function requestPlan(): Promise<Plan | null> {
  const { plan } = await apiFetch<PlanEnvelope>('/api/admissions/action-plan', {
    method: 'POST',
    body: JSON.stringify({ timeZone, force: false }),
  });
  return plan;
}

export async function resolveTask(
  taskId: string,
  status: Exclude<TaskStatus, 'open'>,
  skipReason?: SkipReason,
): Promise<Plan | null> {
  const { plan } = await apiFetch<PlanEnvelope>(`/api/admissions/action-plan/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, skipReason: skipReason ?? null }),
  });
  return plan;
}
