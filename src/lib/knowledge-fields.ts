import {
  CONNECTION_ROLES,
  EXPERIENCE_KINDS,
  type Knowledge,
  type KnowledgeKind,
  LIMITS,
  PROFICIENCIES,
} from '@/lib/knowledge';

// What each kind of item asks for, the same fields as the website's forms
// (src/app/dashboard/(sidebar)/(main)/knowledge in unive-v2). One native
// form draws them all (see knowledge-form.ios.tsx).

/** A field's value while editing: text, a month ("YYYY-MM"), a choice, or on/off. */
export type DraftValue = string | boolean | null;
export type Draft = Record<string, DraftValue>;

type Option = { value: string; label: string };

export type Field =
  | { key: string; label: string; type: 'text'; required?: boolean; max?: number; placeholder?: string; keyboard?: 'email-address' | 'phone-pad' | 'decimal-pad' | 'numeric' }
  | { key: string; label: string; type: 'multiline'; required?: boolean; min?: number; max: number; placeholder?: string }
  | { key: string; label: string; type: 'choice'; options: readonly Option[]; optional?: boolean }
  | { key: string; label: string; type: 'month'; required?: boolean; hiddenWhen?: string }
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'activity' };

export type FormSpec = {
  /** "Activity", for "New Activity" and "Delete Activity". */
  noun: string;
  sections: { title?: string; footer?: string; fields: Field[] }[];
  empty: Draft;
  toDraft: (item: never) => Draft;
  toPayload: (draft: Draft) => unknown;
};

const text = (value: DraftValue) => (typeof value === 'string' ? value.trim() : '');
const month = (iso: string | null | undefined) => (iso ? iso.slice(0, 7) : null);

export const FORMS: Record<KnowledgeKind, FormSpec> = {
  experiences: {
    noun: 'Activity',
    sections: [
      {
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true, max: LIMITS.title, placeholder: 'Robotics Club captain' },
          { key: 'organization', label: 'Organization', type: 'text', max: LIMITS.title, placeholder: 'Optional' },
          { key: 'kind', label: 'Type', type: 'choice', options: EXPERIENCE_KINDS },
        ],
      },
      {
        fields: [
          { key: 'startDate', label: 'Started', type: 'month' },
          { key: 'endDate', label: 'Ended', type: 'month' },
        ],
      },
      {
        title: 'What you did',
        fields: [
          { key: 'description', label: 'Description', type: 'multiline', required: true, min: 5, max: LIMITS.description, placeholder: 'Your role, what you did and what came of it' },
          { key: 'skills', label: 'Skills', type: 'text', placeholder: 'Comma-separated, e.g. Leadership, Python' },
        ],
      },
    ],
    empty: { title: '', organization: '', kind: 'extracurricular', startDate: null, endDate: null, description: '', skills: '', iconImage: 'project' },
    toDraft: (item: Knowledge['experiences'][number]) => ({
      title: item.title,
      organization: item.organization ?? '',
      kind: item.kind,
      startDate: month(item.startDate),
      endDate: month(item.endDate),
      description: item.description,
      skills: item.skills.join(', '),
      iconImage: item.iconImage.replace(/\.webp$/, ''),
    }),
    toPayload: (draft) => ({
      title: text(draft.title),
      organization: text(draft.organization),
      kind: draft.kind,
      startDate: draft.startDate,
      endDate: draft.endDate,
      description: text(draft.description),
      skills: text(draft.skills)
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, LIMITS.skills),
      iconImage: draft.iconImage || 'project',
    }),
  },

  professions: {
    noun: 'Work Experience',
    sections: [
      {
        fields: [
          { key: 'name', label: 'Role', type: 'text', required: true, max: LIMITS.title, placeholder: 'Barista' },
          { key: 'company', label: 'Company', type: 'text', max: LIMITS.title, placeholder: 'Optional' },
        ],
      },
      {
        fields: [
          { key: 'startDate', label: 'Started', type: 'month', required: true },
          { key: 'isCurrent', label: 'I work here now', type: 'toggle' },
          { key: 'endDate', label: 'Ended', type: 'month', required: true, hiddenWhen: 'isCurrent' },
        ],
      },
      {
        title: 'What you did',
        fields: [{ key: 'description', label: 'Description', type: 'multiline', max: LIMITS.description, placeholder: 'Optional' }],
      },
    ],
    empty: { name: '', company: '', startDate: null, isCurrent: false, endDate: null, description: '' },
    toDraft: (item: Knowledge['professions'][number]) => ({
      name: item.name,
      company: item.company ?? '',
      startDate: month(item.startDate),
      isCurrent: item.isCurrent,
      endDate: month(item.endDate),
      description: item.description ?? '',
    }),
    toPayload: (draft) => ({
      name: text(draft.name),
      company: text(draft.company),
      startDate: draft.startDate,
      isCurrent: draft.isCurrent === true,
      endDate: draft.isCurrent ? null : draft.endDate,
      description: text(draft.description),
    }),
  },

  achievements: {
    noun: 'Achievement',
    sections: [
      {
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true, max: LIMITS.achievementTitle, placeholder: 'National Merit Semifinalist' },
          { key: 'issuerOrEvent', label: 'Awarded by', type: 'text', max: LIMITS.title, placeholder: 'Optional' },
          { key: 'achievementDate', label: 'Date', type: 'month' },
          { key: 'experienceId', label: 'Activity', type: 'activity' },
        ],
      },
      {
        title: 'Details',
        fields: [{ key: 'description', label: 'Description', type: 'multiline', max: LIMITS.description, placeholder: 'Optional' }],
      },
    ],
    empty: { title: '', issuerOrEvent: '', achievementDate: null, experienceId: null, description: '' },
    toDraft: (item: Knowledge['achievements'][number]) => ({
      title: item.title,
      issuerOrEvent: item.issuerOrEvent ?? '',
      achievementDate: month(item.achievementDate),
      experienceId: item.experienceId,
      description: item.description ?? '',
    }),
    toPayload: (draft) => ({
      title: text(draft.title),
      issuerOrEvent: text(draft.issuerOrEvent),
      achievementDate: draft.achievementDate,
      experienceId: draft.experienceId || null,
      description: text(draft.description),
    }),
  },

  references: {
    noun: 'Reference',
    sections: [
      {
        fields: [
          { key: 'fullName', label: 'Name', type: 'text', required: true, max: LIMITS.title, placeholder: 'Ms. Rivera' },
          { key: 'connectionRole', label: 'Role', type: 'choice', options: CONNECTION_ROLES, optional: true },
          { key: 'organization', label: 'Organization', type: 'text', max: LIMITS.title, placeholder: 'Optional' },
          { key: 'experienceId', label: 'Activity', type: 'activity' },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { key: 'email', label: 'Email', type: 'text', keyboard: 'email-address', placeholder: 'Optional' },
          { key: 'phone', label: 'Phone', type: 'text', keyboard: 'phone-pad', placeholder: 'Optional' },
        ],
      },
      {
        fields: [{ key: 'agreedToWriteRecLetter', label: 'Agreed to write a letter', type: 'toggle' }],
      },
      {
        title: 'How they know you',
        fields: [{ key: 'relationship', label: 'Details', type: 'multiline', max: LIMITS.referenceDetails, placeholder: 'Optional' }],
      },
    ],
    empty: { fullName: '', connectionRole: null, organization: '', experienceId: null, email: '', phone: '', agreedToWriteRecLetter: false, relationship: '' },
    toDraft: (item: Knowledge['references'][number]) => ({
      fullName: item.fullName,
      connectionRole: item.connectionRole,
      organization: item.organization ?? '',
      experienceId: item.experienceId,
      email: item.email ?? '',
      phone: item.phone ?? '',
      agreedToWriteRecLetter: item.agreedToWriteRecLetter,
      relationship: item.relationship ?? '',
    }),
    toPayload: (draft) => ({
      fullName: text(draft.fullName),
      connectionRole: draft.connectionRole ?? '',
      organization: text(draft.organization),
      experienceId: draft.experienceId || null,
      email: text(draft.email),
      phone: text(draft.phone),
      agreedToWriteRecLetter: draft.agreedToWriteRecLetter === true,
      relationship: text(draft.relationship),
    }),
  },

  languages: {
    noun: 'Language',
    sections: [
      {
        fields: [
          { key: 'language', label: 'Language', type: 'text', required: true, max: LIMITS.language, placeholder: 'Spanish' },
          { key: 'proficiency', label: 'Level', type: 'choice', options: PROFICIENCIES },
          { key: 'certificationOrCourse', label: 'Certificate', type: 'text', max: LIMITS.certification, placeholder: 'Optional, e.g. DELE B2' },
        ],
      },
    ],
    empty: { language: '', proficiency: 'conversational', certificationOrCourse: '' },
    toDraft: (item: Knowledge['languages'][number]) => ({
      language: item.language,
      proficiency: item.proficiency,
      certificationOrCourse: item.certificationOrCourse ?? '',
    }),
    toPayload: (draft) => ({
      language: text(draft.language),
      proficiency: draft.proficiency,
      certificationOrCourse: text(draft.certificationOrCourse),
    }),
  },

  notes: {
    noun: 'Note',
    sections: [
      {
        footer: 'Goals, circumstances, interests: anything that helps the AI give better advice.',
        fields: [{ key: 'content', label: 'Note', type: 'multiline', required: true, min: 5, max: LIMITS.note, placeholder: 'I want to study abroad in my second year…' }],
      },
    ],
    empty: { content: '' },
    toDraft: (item: Knowledge['notes'][number]) => ({ content: item.content }),
    toPayload: (draft) => ({ content: text(draft.content) }),
  },
};

/** The item being edited, or undefined. Languages are keyed by name. */
export function findItem(knowledge: Knowledge, kind: KnowledgeKind, id: string) {
  if (kind === 'languages') return knowledge.languages.find((language) => language.language === id);
  return (knowledge[kind] as { id: string }[]).find((item) => item.id === id);
}

/** Whether the draft can be saved: required fields filled, lengths in range. */
export function isComplete(spec: FormSpec, draft: Draft) {
  return spec.sections.every((section) =>
    section.fields.every((field) => {
      if (field.type === 'month') return !field.required || (field.hiddenWhen && draft[field.hiddenWhen]) || draft[field.key] != null;
      if (field.type === 'text' || field.type === 'multiline') {
        const value = text(draft[field.key]);
        if (field.required && !value) return false;
        if (field.type === 'multiline' && field.min && value && value.length < field.min) return false;
        if (field.max && value.length > field.max) return false;
      }
      return true;
    }),
  );
}
