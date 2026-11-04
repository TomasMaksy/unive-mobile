import type { AboutDraft } from '@/features/knowledge/about';
import type { PickKind } from '@/features/knowledge/picker';
import type { Draft, DraftValue } from '@/lib/knowledge-fields';

// Shared by about-form.ios.tsx and about-form.tsx (a file importing
// '@/components/about-form' from the .ios file would import itself).

export type AboutFormProps = {
  draft: AboutDraft;
  onChange: (next: AboutDraft) => void;
  /** Your scores, as text while editing. */
  scores: Draft;
  onScoreChange: (key: string, value: DraftValue) => void;
  /** Opens the search page for a school, place or study interest. */
  onPick: (kind: PickKind) => void;
  /** Names to show for the chosen country and state. */
  countryLabel: string | null;
  stateLabel: string | null;
};

export const MAX_INTERESTS = 20;
