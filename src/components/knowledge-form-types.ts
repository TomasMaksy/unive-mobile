import type { Draft, DraftValue, FormSpec } from '@/lib/knowledge-fields';

// Shared by knowledge-form.ios.tsx and knowledge-form.tsx (a file importing
// '@/components/knowledge-form' from the .ios file would import itself).

export type KnowledgeFormProps = {
  sections: FormSpec['sections'];
  draft: Draft;
  onChange: (key: string, value: DraftValue) => void;
  /** Activities an achievement or reference can be linked to. */
  activities: { id: string; title: string }[];
  /** Shown at the bottom when editing an existing item. */
  onDelete?: () => void;
  deleteLabel?: string;
};
