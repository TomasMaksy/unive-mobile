// Shared by guide-contents.ios.tsx and guide-contents.tsx (a file importing
// '@/features/guide/guide-contents' from the .ios file would import itself).

export type GuideContentsProps = {
  sections: { id: string; title: string; emoji: string | null }[];
  /** The section you're reading now. */
  currentId: string | null;
  onSelect: (id: string) => void;
};
