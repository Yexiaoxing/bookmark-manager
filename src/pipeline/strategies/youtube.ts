import type { BookmarkRow } from "../../services/bookmarks.js";
import type { LlmClient } from "../../services/llm.js";
import {
  fetchYoutubeDetails,
  fetchYoutubeTranscript,
} from "../../services/youtube.js";

export type YoutubeProcessingBlock = {
  videoId: string;
  channel: string | null;
  durationSec: number | null;
  transcript: string | null;
  transcriptLang: string | null;
  summary: string | null;
};

export async function prepareYoutubeContent(
  bm: BookmarkRow,
  videoId: string,
  llm: LlmClient,
): Promise<{
  title: string | null;
  bodyText: string;
  youtubeBlock: YoutubeProcessingBlock;
}> {
  let title: string | null = bm.title ?? null;
  const details = await fetchYoutubeDetails(videoId);
  title = details.title ?? title;
  const tr = await fetchYoutubeTranscript(videoId, bm.url);
  const transcript = tr?.text ?? "";
  const summary =
    transcript.trim().length > 0
      ? await llm.summarizeYoutubeTranscript(transcript)
      : null;
  const youtubeBlock: YoutubeProcessingBlock = {
    videoId,
    channel: details.channel,
    durationSec: details.durationSec,
    transcript: transcript || null,
    transcriptLang: tr?.lang ?? null,
    summary,
  };
  const bodyText = [title, transcript, summary].filter(Boolean).join("\n\n");
  return { title, bodyText, youtubeBlock };
}
