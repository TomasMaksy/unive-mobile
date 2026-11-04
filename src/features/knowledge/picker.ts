import type { useRouter } from 'expo-router';

import type { Place, School, StudyInterest } from '@/features/knowledge/about';

// Choosing a stage, school, place or study interest on its own search page
// (app/(app)/knowledge/pick.tsx), the way iOS settings push a list to choose
// from. The page that asked waits for the answer: `await pickFrom(router, 'country')`.

export type PickKind = 'stage' | 'highSchool' | 'university' | 'country' | 'state' | 'interest';
export type Picked = School | Place | StudyInterest;

type Router = ReturnType<typeof useRouter>;

// The one open request. Each has its own id, so a page closing late can't
// answer the next request (one pick can lead straight into another).
let waiting: { id: string; resolve: (value: Picked | undefined) => void } | null = null;
let nextId = 0;

export function pickFrom(
  router: Router,
  kind: PickKind,
  context: { country?: string | null; state?: string | null; selected?: string | null } = {},
) {
  waiting?.resolve(undefined);
  const id = String(++nextId);
  return new Promise<Picked | undefined>((resolve) => {
    waiting = { id, resolve };
    const params: Record<string, string> = { kind, pick: id };
    for (const [key, value] of Object.entries(context)) if (value) params[key] = value;
    // The stage has its own two-step page; the rest are search lists.
    router.push({ pathname: kind === 'stage' ? '/knowledge/stage' : '/knowledge/pick', params });
  });
}

/** Called by the search page: with the choice, or nothing when it closes without one. */
export function finishPick(id: string, value?: Picked) {
  if (waiting?.id !== id) return;
  waiting.resolve(value);
  waiting = null;
}
