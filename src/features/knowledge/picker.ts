import type { useRouter } from 'expo-router';

import type { Place, School, StudyInterest } from '@/features/knowledge/about';

// Choosing a school, place or study interest on its own search page
// (app/(app)/knowledge/pick.tsx), the way iOS forms push a list to choose from.
// The page that asked waits for the answer: `await pickFrom(router, 'country')`.

export type PickKind = 'highSchool' | 'university' | 'country' | 'state' | 'interest';
export type Picked = School | Place | StudyInterest;

let waiting: ((value: Picked | undefined) => void) | null = null;

type Router = ReturnType<typeof useRouter>;

export function pickFrom(router: Router, kind: PickKind, context: { country?: string | null; state?: string | null } = {}) {
  waiting?.(undefined);
  return new Promise<Picked | undefined>((resolve) => {
    waiting = resolve;
    router.push({
      pathname: '/knowledge/pick',
      params: { kind, ...(context.country ? { country: context.country } : {}), ...(context.state ? { state: context.state } : {}) },
    });
  });
}

/** Called by the search page: with the choice, or nothing when it closes without one. */
export function finishPick(value?: Picked) {
  waiting?.(value);
  waiting = null;
}
