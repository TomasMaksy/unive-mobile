import { Directory, File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { API_URL } from '@/lib/auth-client';
import { ApiError, apiFetch, authHeaders } from '@/lib/api';
import { refreshKnowledge } from '@/lib/knowledge';

// The Dropzone: you add a document (a CV, a transcript, a certificate…) and
// unive-v2 reads it in the background and fills in your Knowledge Library.
// Uses the website's own routes: POST /api/dropzone/parse starts a job,
// GET /api/dropzone/jobs/{id} follows it. The server keeps a job for an hour,
// so the app remembers your recent ones, like the website does.

export type AnalysisMode = 'faster' | 'precise';

export const ANALYSIS_MODES: { value: AnalysisMode; label: string; detail: string }[] = [
  { value: 'faster', label: 'Faster', detail: 'A quick read, best for most CVs and transcripts.' },
  { value: 'precise', label: 'More precise', detail: 'Slower and more thorough, for dense or unusual documents.' },
];

/** What's worth adding (the website's list). */
export const HELPFUL_DOCUMENTS = [
  'Your best essays and personal statements',
  'CVs and resumes',
  'Transcripts and diplomas',
  'Recommendation or recognition letters',
  'Competition awards and certificates',
];

/** File types the server accepts (PDF, Word, text, spreadsheets, images). */
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_BYTES = 5_000_000;

type Applied = {
  fields: { label?: string }[];
  looseNotesCreated: number;
  looseNotesUpdated: number;
  referencesCreated: number;
  referencesUpdated: number;
  languagesCreated: number;
  languagesUpdated: number;
  professionsCreated: number;
  professionsUpdated: number;
  experiencesCreated: number;
  experiencesUpdated: number;
  achievementsCreated: number;
  achievementsUpdated: number;
};

export type Conflict = {
  field: string;
  label: string;
  proposedValue: string | number;
  currentValue: string | number | null;
  scope: 'structured' | 'extended';
  status: 'would_conflict' | 'needs_resolution';
  detail?: string;
};

export type Job =
  | { jobId: string; status: 'analyzing' | 'applying'; fileName: string }
  | { jobId: string; status: 'ready'; fileName: string; result: { applied: Applied; conflicts: Conflict[] } }
  | { jobId: string; status: 'error'; fileName: string; error: string }
  | { jobId: string; status: 'cancelled'; fileName: string };

/** A job the app knows about, with its latest state once loaded. */
export type Upload = { jobId: string; fileName: string; startedAt: string; job?: Job; uploading?: boolean; failed?: string };

const STORAGE_KEY = 'dropzone-jobs';
const MAX_KEPT = 10;
const JOB_LIFETIME_MS = 60 * 60 * 1000;
const POLL_MS = 2500;

let uploads: Upload[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function set(next: Upload[]) {
  uploads = next;
  listeners.forEach((listener) => listener());
  void save();
}

function update(jobId: string, change: Partial<Upload>) {
  set(uploads.map((upload) => (upload.jobId === jobId ? { ...upload, ...change } : upload)));
}

async function save() {
  const kept = uploads.filter((upload) => !upload.uploading && !upload.failed);
  const refs = kept.map(({ jobId, fileName, startedAt }) => ({ jobId, fileName, startedAt }));
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(refs));
  } catch {
    // Only a convenience; the uploads are still on the server.
  }
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    const refs = raw ? (JSON.parse(raw) as Upload[]) : [];
    const fresh = refs.filter((ref) => Date.now() - Date.parse(ref.startedAt) < JOB_LIFETIME_MS);
    set([...uploads, ...fresh.filter((ref) => !uploads.some((upload) => upload.jobId === ref.jobId))]);
  } catch {
    // Starts empty.
  }
  void poll();
}

/** Your recent uploads, newest first, kept up to date while any is being read. */
export function useUploads() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      void load();
      return () => listeners.delete(listener);
    },
    () => uploads,
  );
}

export const isWorking = (upload: Upload) =>
  upload.uploading || (!upload.failed && (!upload.job || upload.job.status === 'analyzing' || upload.job.status === 'applying'));

let polling = false;

// Checks every job that's still being read, until none is.
async function poll() {
  if (polling) return;
  polling = true;
  try {
    while (true) {
      const pending = uploads.filter((upload) => !upload.uploading && !upload.failed && isWorking(upload));
      const unloaded = uploads.filter((upload) => !upload.uploading && !upload.failed && !upload.job);
      const toCheck = [...new Set([...pending, ...unloaded])];
      if (toCheck.length === 0) break;
      let finished = false;
      await Promise.all(
        toCheck.map(async (upload) => {
          try {
            const job = await apiFetch<Job>(`/api/dropzone/jobs/${upload.jobId}`);
            if (upload.job && isWorking(upload) && job.status === 'ready') finished = true;
            update(upload.jobId, { job });
          } catch (error) {
            // Gone from the server (over an hour old): forget it.
            if (error instanceof ApiError && error.status === 404) set(uploads.filter((entry) => entry.jobId !== upload.jobId));
          }
        }),
      );
      // A finished document has changed your library.
      if (finished) void refreshKnowledge().catch(() => {});
      if (uploads.some((upload) => isWorking(upload) && !upload.uploading)) await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  } finally {
    polling = false;
  }
}

export type PickedFile = { uri: string; name: string; mimeType: string; size?: number | null };

function namedCopy(file: PickedFile) {
  const source = new File(file.uri);
  if (source.name === file.name) return source;
  try {
    const folder = new Directory(Paths.cache, 'dropzone', String(Date.now()));
    folder.create({ intermediates: true });
    const copy = new File(folder, file.name.replace(/[/\\]/g, '_'));
    source.copy(copy);
    return copy;
  } catch {
    return source;
  }
}

/** Sends a document to be read. It shows in the list straight away. */
export async function uploadDocument(file: PickedFile, mode: AnalysisMode) {
  await load();
  const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  set([{ jobId: tempId, fileName: file.name, startedAt: new Date().toISOString(), uploading: true }, ...uploads]);

  try {
    // The bytes of the file on the phone, sent as a multipart form.
    const body = new FormData();
    // Under its real name: picked files sit in the app's cache with a random
    // one, and the server shows the name it receives.
    body.append('file', namedCopy(file) as unknown as Blob, file.name);
    body.append('analysisMode', mode);
    const response = await expoFetch(`${API_URL}/api/dropzone/parse`, {
      method: 'POST',
      body,
      credentials: 'omit',
      headers: await authHeaders(),
    });
    const data = (await response.json().catch(() => ({}))) as { jobId?: string; error?: string; duplicate?: boolean };
    if (!response.ok || !data.jobId) throw new Error(data.error ?? 'Couldn’t upload this file.');

    const jobId = data.jobId;
    // An upload of the same file again points at the earlier job.
    const others = uploads.filter((upload) => upload.jobId !== tempId && upload.jobId !== jobId);
    const entry = uploads.find((upload) => upload.jobId === tempId);
    set([{ jobId, fileName: file.name, startedAt: entry?.startedAt ?? new Date().toISOString() }, ...others].slice(0, MAX_KEPT));
    void poll();
    return { duplicate: data.duplicate === true };
  } catch (error) {
    update(tempId, { uploading: false, failed: error instanceof Error ? error.message : 'Couldn’t upload this file.' });
    return { duplicate: false };
  }
}

/** Reads a failed document again (the file is still on the server). */
export async function retryUpload(jobId: string) {
  await apiFetch(`/api/dropzone/jobs/${jobId}/retry`, { method: 'POST', body: '{}' });
  update(jobId, { job: undefined });
  void poll();
}

/** Stops reading a document. */
export async function cancelUpload(jobId: string) {
  await apiFetch(`/api/dropzone/jobs/${jobId}`, { method: 'DELETE' }).catch(() => {});
  set(uploads.filter((upload) => upload.jobId !== jobId));
}

/** Takes it off the list (what it added stays in your library). */
export function dismissUpload(jobId: string) {
  set(uploads.filter((upload) => upload.jobId !== jobId));
}

/** What a finished document added, in words: "2 activities · 1 language". */
export function summarize(applied: Applied) {
  const count = (created: number, updated: number) => created + updated;
  const parts: [number, string, string][] = [
    [count(applied.experiencesCreated, applied.experiencesUpdated), 'activity', 'activities'],
    [count(applied.professionsCreated, applied.professionsUpdated), 'job', 'jobs'],
    [count(applied.achievementsCreated, applied.achievementsUpdated), 'achievement', 'achievements'],
    [count(applied.referencesCreated, applied.referencesUpdated), 'reference', 'references'],
    [count(applied.languagesCreated, applied.languagesUpdated), 'language', 'languages'],
    [count(applied.looseNotesCreated, applied.looseNotesUpdated), 'note', 'notes'],
    [applied.fields.length, 'detail about you', 'details about you'],
  ];
  const words = parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  return words.length ? words.join(' · ') : 'Nothing new to add';
}

// Conflicts: a document says something different from your profile, like
// another GPA. The same field from several documents is asked about once.

export type MergedConflict = {
  key: string;
  field: string;
  label: string;
  detail?: string;
  jobIds: string[];
  fileNames: string[];
  options: { value: string | number; source: 'profile' | 'document' }[];
};

export function mergedConflicts(list: Upload[]): MergedConflict[] {
  const byKey = new Map<string, MergedConflict>();
  for (const upload of list) {
    if (upload.job?.status !== 'ready') continue;
    for (const conflict of upload.job.result.conflicts) {
      const key = `${conflict.scope}:${conflict.field}`;
      const merged = byKey.get(key) ?? {
        key,
        field: conflict.field,
        label: conflict.label,
        detail: conflict.status === 'needs_resolution' ? conflict.detail : undefined,
        jobIds: [],
        fileNames: [],
        options: conflict.currentValue == null ? [] : [{ value: conflict.currentValue, source: 'profile' as const }],
      };
      merged.jobIds.push(upload.jobId);
      merged.fileNames.push(upload.fileName);
      if (!merged.options.some((option) => String(option.value) === String(conflict.proposedValue))) {
        merged.options.push({ value: conflict.proposedValue, source: 'document' });
      }
      byKey.set(key, merged);
    }
  }
  return [...byKey.values()];
}

/** Keeps one value for a conflicting field, then reloads what changed. */
export async function resolveConflict(conflict: MergedConflict, value: string | number) {
  const jobIds = [...new Set([...conflict.jobIds, ...uploads.filter((upload) => upload.job?.status === 'ready').map((upload) => upload.jobId)])];
  await apiFetch('/api/mobile/dropzone/resolve', { method: 'POST', body: JSON.stringify({ jobIds, field: conflict.field, value }) });
  await Promise.all([
    ...conflict.jobIds.map(async (jobId) => {
      const job = await apiFetch<Job>(`/api/dropzone/jobs/${jobId}`).catch(() => undefined);
      if (job) update(jobId, { job });
    }),
    refreshKnowledge().catch(() => {}),
  ]);
}
