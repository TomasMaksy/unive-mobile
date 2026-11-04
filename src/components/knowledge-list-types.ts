import type { Knowledge, KnowledgeKind } from '@/lib/knowledge';

// Shared by knowledge-list.ios.tsx and knowledge-list.tsx (a file importing
// '@/components/knowledge-list' from the .ios file would import itself).

export type KnowledgeTab = 'general' | 'activities' | 'other';

export const KNOWLEDGE_TABS: { value: KnowledgeTab; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'activities', label: 'Activities' },
  { value: 'other', label: 'Other' },
];

export type KnowledgeListProps = {
  knowledge: Knowledge;
  tab: KnowledgeTab;
  onTabChange: (tab: KnowledgeTab) => void;
  /** Open an item to edit it, or a blank one (no id) to add one. */
  onOpen: (kind: KnowledgeKind, id?: string) => void;
  onDelete: (kind: KnowledgeKind, id: string) => void;
  onEditAcademics: () => void;
  /** Pull to refresh. */
  onRefresh: () => Promise<void>;
};

export const KNOWLEDGE_COPY = {
  subtitle: 'Everything the AI knows about you. The more it knows, the better its advice.',
  educationFooter: 'Changing your school and location in the app is coming soon.',
} as const;

// Hermes (the app's JavaScript engine) may not have Intl.DisplayNames; then the code shows.
const REGIONS =
  typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const COMMON: Record<string, string> = { US: 'United States', GB: 'United Kingdom', LT: 'Lithuania', CA: 'Canada', IN: 'India' };

export function countryName(code: string | null | undefined) {
  if (!code) return null;
  try {
    return REGIONS?.of(code) ?? COMMON[code] ?? code;
  } catch {
    return COMMON[code] ?? code;
  }
}
