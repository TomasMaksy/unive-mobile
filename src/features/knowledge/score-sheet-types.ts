import type { Academics } from '@/lib/knowledge';

// Shared by score-sheet.ios.tsx and score-sheet.tsx.
export type ScoreSheetProps = {
  /** The score being changed; null when the sheet is closed. */
  scoreKey: keyof Academics | null;
  current: number | null;
  onClose: () => void;
};
