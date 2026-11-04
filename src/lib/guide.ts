import { apiFetch } from '@/lib/api';
import { API_URL } from '@/lib/auth-client';

// The Application Guide, the same course as the website's /dashboard/guide.
// unive-v2 turns its lessons into data the app draws natively
// (src/app/api/mobile/guide/serialize.ts there).

export type GuideSpan = { text: string; bold?: boolean; italic?: boolean };

export type GuideBlock =
  | { type: 'paragraph'; spans: GuideSpan[] }
  | { type: 'list'; ordered: boolean; items: GuideSpan[][] }
  | { type: 'callout'; title: string; blocks: GuideBlock[] }
  | { type: 'intlNote'; blocks: GuideBlock[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

export type GuideTopicSummary = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  sections: { id: string; title: string; emoji?: string }[];
  /** Rough reading time. */
  readingMinutes: number | null;
};

export type GuideSection = {
  id: string;
  title: string;
  tocTitle: string;
  emoji: string | null;
  blocks: GuideBlock[];
};

export type GuideTopic = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  audioManifestPath: string;
  readingMinutes: number;
  intro: GuideBlock[];
  sections: GuideSection[];
};

/** The website's narration: one recording per section, plus "intro". */
export type GuideAudioSegment = { id: string; title: string; audioUrl: string; durationSeconds: number };

export function fetchGuideTopics() {
  return apiFetch<{ topics: GuideTopicSummary[] }>('/api/mobile/guide').then(({ topics }) => topics);
}

export function fetchGuideTopic(id: string) {
  return apiFetch<GuideTopic>(`/api/mobile/guide/${encodeURIComponent(id)}`);
}

/** Ticks the topic off on your roadmap, like opening it on the website. */
export function markGuideRead(id: string) {
  return apiFetch(`/api/mobile/guide/${encodeURIComponent(id)}/read`, { method: 'POST' }).catch(() => {});
}

/** The topic's recordings, in reading order, or [] when it has none. */
export async function fetchGuideAudio(topic: GuideTopic): Promise<GuideAudioSegment[]> {
  try {
    const response = await fetch(siteUrl(topic.audioManifestPath));
    if (!response.ok) return [];
    const manifest = (await response.json()) as { segments: GuideAudioSegment[] };
    return manifest.segments.map((segment) => ({ ...segment, audioUrl: siteUrl(segment.audioUrl) }));
  } catch {
    return [];
  }
}

/** A path on unive-v2 (images, audio) as a full address. */
export function siteUrl(path: string) {
  return `${API_URL}${path}`;
}
