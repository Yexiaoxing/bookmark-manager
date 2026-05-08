import type { EventEmitter } from "node:events";
import type PQueue from "p-queue";
import type { BookmarkKind, BookmarksService } from "../services/bookmarks.js";
import { DeletedContentError } from "../services/extractor.js";
import type { LlmClient } from "../services/llm.js";
import { classifyUrl } from "../services/url.js";
import { logPipeline } from "./logging.js";
import { toQueuePriority } from "./queue.js";
import { prepareArticleContent } from "./strategies/article.js";
import { prepareOtherContent } from "./strategies/other.js";
import { prepareYoutubeContent } from "./strategies/youtube.js";
import type { PipelineDoneEvent } from "./types.js";

export type ProcessDeps = {
  bookmarks: BookmarksService;
  llm: LlmClient;
  queue: PQueue;
  events: EventEmitter;
  retryMaxAttemptsExclusive: number;
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function createProcessBookmark(deps: ProcessDeps) {
  const { bookmarks, llm, queue, events, retryMaxAttemptsExclusive } = deps;

  function emitDone(payload: PipelineDoneEvent) {
    events.emit("done", payload);
  }

  return async function processBookmark(
    id: number,
    attempt = 0,
  ): Promise<void> {
    logPipeline("debug", "process.start", {
      id,
      attempt,
      queueSize: queue.size,
    });
    const bm = await bookmarks.getById(id);
    if (!bm) {
      logPipeline("info", "process.skip.missing", { id, attempt });
      return;
    }
    if (bm.status === "done") {
      logPipeline("info", "process.skip.done", { id, attempt });
      return;
    }
    await bookmarks.markStatus(id, "processing", null);
    try {
      const url = bm.url;
      const { kind, videoId } = classifyUrl(url);
      logPipeline("debug", "process.classified", {
        id,
        attempt,
        kind,
        videoId: videoId ?? null,
      });
      let title: string | null = bm.title ?? null;
      let bodyText = "";
      let youtubeBlock:
        | Awaited<ReturnType<typeof prepareYoutubeContent>>["youtubeBlock"]
        | null = null;

      if (kind === "youtube" && videoId) {
        const yt = await prepareYoutubeContent(bm, videoId, llm);
        title = yt.title;
        bodyText = yt.bodyText;
        youtubeBlock = yt.youtubeBlock;
      } else if (kind === "article") {
        const art = await prepareArticleContent(bm, url);
        title = art.title;
        bodyText = art.bodyText;
      } else {
        const o = prepareOtherContent(bm, url);
        title = o.title;
        bodyText = o.bodyText;
      }

      const mappedKind: BookmarkKind =
        kind === "youtube"
          ? "youtube"
          : kind === "article"
            ? "article"
            : "other";

      const enriched = await llm.enrichBookmark({
        url,
        title,
        bodyText,
        isYoutube: mappedKind === "youtube",
      });
      logPipeline("debug", "process.enriched", {
        id,
        attempt,
        mappedKind,
        tags: enriched.tags.length,
      });

      await bookmarks.saveProcessed({
        id,
        title,
        abstract: enriched.abstract,
        abstractZh: enriched.abstractZh,
        kind: mappedKind,
        tagNames: enriched.tags,
        youtube: youtubeBlock,
      });

      const done = await bookmarks.getById(id);
      const backlogCount = queue.size + queue.pending;
      logPipeline("debug", "process.done", {
        id,
        attempt,
        title: done?.title ?? title,
        status: "done",
        backlogCount,
      });
      emitDone({
        id,
        url: bm.url,
        source: bm.source,
        sourceChatId: bm.sourceChatId,
        sourceMessageId: bm.sourceMessageId,
        title: done?.title ?? null,
        abstract: done?.abstract ?? null,
        abstractZh: done?.abstractZh ?? null,
        backlogCount,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      logPipeline("error", "process.error", {
        id,
        attempt,
        error: msg,
        url: bm.url,
      });
      if (e instanceof DeletedContentError) {
        logPipeline("info", "process.deleted", { id, attempt, reason: msg });
        await bookmarks.markStatus(id, "deleted", msg);
        await bookmarks.refreshFtsRow(id);
        const backlogCount = queue.size + queue.pending;
        emitDone({
          id,
          url: bm.url,
          source: bm.source,
          sourceChatId: bm.sourceChatId,
          sourceMessageId: bm.sourceMessageId,
          title: bm.title,
          abstract: null,
          abstractZh: null,
          error: `Deleted: ${msg}`,
          backlogCount,
        });
        return;
      }
      if (attempt < retryMaxAttemptsExclusive) {
        logPipeline("debug", "process.retry.waiting", {
          id,
          nextAttempt: attempt + 1,
          delayMs: 1500 * (attempt + 1),
        });
        await sleep(1500 * (attempt + 1));
        logPipeline("debug", "process.retry.scheduled", {
          id,
          nextAttempt: attempt + 1,
          delayMs: 1500 * (attempt + 1),
        });
        void queue.add(() => processBookmark(id, attempt + 1), {
          priority: toQueuePriority("high"),
        });
        return;
      }
      logPipeline("error", "process.failed", {
        id,
        attempt,
        error: msg,
        url: bm.url,
      });
      await bookmarks.markStatus(id, "error", msg);
      const backlogCount = queue.size + queue.pending;
      emitDone({
        id,
        url: bm.url,
        source: bm.source,
        sourceChatId: bm.sourceChatId,
        sourceMessageId: bm.sourceMessageId,
        title: bm.title,
        abstract: null,
        abstractZh: null,
        error: msg,
        backlogCount,
      });
    }
  };
}
