import type { EnrichBookmarkInput } from "./types.js";

export const ENRICH_SYSTEM_PROMPT = `You are a bookmark assistant. Given a URL and page content, produce:
- an informative English abstract
- a natural Chinese abstract
- 3-6 topical tags.
Tags must be lowercase kebab-case (letters, numbers, hyphens only). No hashtags. JSON only.`;

export function buildEnrichUserPayload(input: {
  url: string;
  title: string | null;
  content: string;
  isYoutube: boolean;
}): string {
  return JSON.stringify({
    url: input.url,
    title: input.title,
    isYoutube: input.isYoutube,
    content: input.content,
  });
}

export function buildEnrichOpenAiUserPrompt(
  input: EnrichBookmarkInput,
): string {
  const truncated = input.bodyText;
  const user = buildEnrichUserPayload({
    url: input.url,
    title: input.title,
    content: truncated,
    isYoutube: input.isYoutube,
  });
  return `${user}\n\nRespond with JSON: {"abstract": string, "abstractZh": string, "tags": string[], "language"?: string}`;
}

export function buildEnrichCursorPrompt(input: EnrichBookmarkInput): string {
  const userPrompt = buildEnrichOpenAiUserPrompt(input);
  return [
    ENRICH_SYSTEM_PROMPT,
    "Return ONLY valid JSON, no markdown fences.",
    `Input: ${userPrompt}`,
  ].join("\n\n");
}

export const YOUTUBE_SUMMARY_SYSTEM_PROMPT = `Summarize the YouTube transcript for the user. Use 2-3 short paragraphs. Then add a bullet list of key moments with timestamps when present in the transcript (e.g. "[1:23] topic"). If timestamps are sparse, still list main ideas as bullets without inventing times.`;
