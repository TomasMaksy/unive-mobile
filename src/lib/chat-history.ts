import type { UIMessage } from 'ai';

import { apiFetch } from '@/lib/api';

/** A past AI chat, as unive-v2 lists them (src/features/chat/queries.ts: getGlobalChatHistory). */
export type ChatSummary = {
  id: string;
  /** The generated title, or the start of the first message for older chats. */
  title: string | null;
  createdAt: string;
  lastUpdatedAt: string;
};

/**
 * The same global chats the website's chat history shows: they're stored by
 * the backend, so a chat started on the phone appears on the web and the
 * other way round. Newest first, up to 50.
 */
export function fetchChatHistory() {
  return apiFetch<ChatSummary[]>('/api/chat/history');
}

/** All messages of one of your chats, oldest first. */
export function fetchChatMessages(chatId: string) {
  return apiFetch<UIMessage[]>(`/api/chat/${chatId}`);
}
