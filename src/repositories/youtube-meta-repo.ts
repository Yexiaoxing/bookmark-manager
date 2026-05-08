import type { AppDb } from "../db/index.js";
import { youtubeMeta } from "../db/schema.js";

export type YoutubeMetaUpsert = {
  videoId: string;
  channel: string | null;
  durationSec: number | null;
  transcript: string | null;
  transcriptLang: string | null;
  summary: string | null;
};

export function createYoutubeMetaRepo(db: AppDb) {
  async function upsertForBookmark(
    bookmarkId: number,
    data: YoutubeMetaUpsert,
  ): Promise<void> {
    await db
      .insert(youtubeMeta)
      .values({
        bookmarkId,
        videoId: data.videoId,
        channel: data.channel,
        durationSec: data.durationSec,
        transcript: data.transcript,
        transcriptLang: data.transcriptLang,
        summary: data.summary,
      })
      .onConflictDoUpdate({
        target: youtubeMeta.bookmarkId,
        set: {
          videoId: data.videoId,
          channel: data.channel,
          durationSec: data.durationSec,
          transcript: data.transcript,
          transcriptLang: data.transcriptLang,
          summary: data.summary,
        },
      });
  }

  return { upsertForBookmark };
}
