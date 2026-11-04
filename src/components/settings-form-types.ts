import type { CalendarStatus, ProfileChanges } from '@/lib/settings';

// Shared by settings-form.ios.tsx and settings-form.tsx (a file importing
// '@/components/settings-form' from the .ios file would import itself).

export type SettingsFormProps = {
  /** Your picture, shown on top; tap it to change it. */
  name: string;
  imageUrl: string | null;
  uploadingPhoto: boolean;
  onEditPhoto: () => void;
  /** The details as you're editing them. */
  draft: ProfileChanges;
  onChange: (changes: Partial<ProfileChanges>) => void;
  email: string;
  onEditEmail: () => void;
  subscribed: boolean;
  /** null while loading. */
  calendar: CalendarStatus | null;
  calendarBusy: boolean;
  onLinkCalendar: () => void;
  onUnlinkCalendar: () => void;
  onOpenKnowledge: () => void;
  erasing: boolean;
  onErase: () => void;
};

export const SETTINGS_COPY = {
  profileFooter: 'Your name and picture show across Unive.',
  subscriptionFooter: 'To change or cancel your plan, sign in at unive.ai on the web and open Settings.',
  calendarLinked: 'Chosen rounds show up on a Google Calendar named Unive deadlines.',
  calendarUnlinked: 'Link Google Calendar so the rounds you choose can show up there.',
  knowledgeFooter: 'Everything the AI knows about you is in your Knowledge Library.',
  eraseFooter:
    'Removes everything Unive stores about you — profile, knowledge, analyses, AI chats, essays, uploads and saves — except your sign-in email. This can’t be undone.',
} as const;
