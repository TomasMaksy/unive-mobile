import { siteUrl } from '@/lib/guide';
import {
  CONNECTION_ROLES,
  EXPERIENCE_KINDS,
  formatMonth,
  formatRange,
  type Knowledge,
  type KnowledgeKind,
  labelOf,
  PROFICIENCIES,
} from '@/lib/knowledge';

// The Knowledge Library's sections, each with its own page in the app (the
// website groups them under General / Activities / Other tabs instead).
// Their 3D icons are the website's, from unive-v2's public/isomorphic-icons.

/** The order of the tiles on the library page. */
export const SECTION_ORDER: KnowledgeKind[] = ['experiences', 'professions', 'achievements', 'references', 'languages', 'notes'];

export const SECTIONS: Record<KnowledgeKind, { title: string; blurb: string; icon: string; addLabel: string }> = {
  experiences: {
    title: 'Activities',
    blurb: 'Research, volunteering, clubs, hobbies and projects.',
    icon: '/isomorphic-icons/people.webp',
    addLabel: 'Add activity',
  },
  professions: {
    title: 'Work',
    blurb: 'Jobs, internships and paid roles.',
    icon: '/isomorphic-icons/job-interview.webp',
    addLabel: 'Add work experience',
  },
  achievements: {
    title: 'Achievements',
    blurb: 'Honors, awards and certifications.',
    icon: '/isomorphic-icons/trophy.webp',
    addLabel: 'Add achievement',
  },
  references: {
    title: 'References',
    blurb: 'People who can vouch for you, like teachers and mentors.',
    icon: '/isomorphic-icons/friend.webp',
    addLabel: 'Add reference',
  },
  languages: {
    title: 'Languages',
    blurb: 'The languages you speak, and how well.',
    icon: '/isomorphic-icons/languages.webp',
    addLabel: 'Add language',
  },
  notes: {
    title: 'Notes',
    blurb: 'Anything else the AI should know: goals, circumstances, what you care about.',
    icon: '/isomorphic-icons/note.webp',
    addLabel: 'Add note',
  },
};

export const SECTION_ICON = (kind: KnowledgeKind) => siteUrl(SECTIONS[kind].icon);

/** One item, ready to show in a list or at the top of its page. */
export type ItemSummary = {
  id: string;
  title: string;
  /** Organization, type, role… */
  subtitle: string | null;
  /** Dates, level, "Writing a letter"… */
  detail: string | null;
  /** The longer text, if any. */
  body: string | null;
  /** The item's own picture (activities have one each), else the section's. */
  icon: string;
};

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ') || null;

export function summaries(knowledge: Knowledge, kind: KnowledgeKind): ItemSummary[] {
  const icon = SECTION_ICON(kind);
  const activityTitle = (id: string | null) => knowledge.experiences.find((experience) => experience.id === id)?.title;

  switch (kind) {
    case 'experiences':
      return knowledge.experiences.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: join(item.organization, labelOf(EXPERIENCE_KINDS, item.kind)),
        detail: formatRange(item.startDate, item.endDate),
        body: item.description || null,
        icon: siteUrl(`/isomorphic-icons/experiences/${item.iconImage.endsWith('.webp') ? item.iconImage : `${item.iconImage || 'project'}.webp`}`),
      }));
    case 'professions':
      return knowledge.professions.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.company,
        detail: formatRange(item.startDate, item.endDate, item.isCurrent),
        body: item.description,
        icon,
      }));
    case 'achievements':
      return knowledge.achievements.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: join(item.issuerOrEvent, activityTitle(item.experienceId)),
        detail: formatMonth(item.achievementDate),
        body: item.description,
        icon,
      }));
    case 'references':
      return knowledge.references.map((item) => ({
        id: item.id,
        title: item.fullName,
        subtitle: join(labelOf(CONNECTION_ROLES, item.connectionRole), item.organization),
        detail: item.agreedToWriteRecLetter ? 'Writing you a letter' : null,
        body: item.relationship,
        icon,
      }));
    case 'languages':
      return knowledge.languages.map((item) => ({
        id: item.language,
        title: item.language,
        subtitle: labelOf(PROFICIENCIES, item.proficiency),
        detail: item.certificationOrCourse,
        body: null,
        icon,
      }));
    case 'notes':
      return knowledge.notes.map((item) => ({
        id: item.id,
        title: item.content,
        subtitle: item.createdBy === 'agent' ? 'Added by Unive' : null,
        detail: null,
        body: null,
        icon,
      }));
  }
}

export function countOf(knowledge: Knowledge, kind: KnowledgeKind) {
  return knowledge[kind].length;
}
