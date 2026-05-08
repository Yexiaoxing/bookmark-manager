import { EventEmitter } from "node:events";
import { logger } from "../logger.js";
import { classifyUrl, normalizeUrl } from "../services/url.js";
import { logPipeline } from "./logging.js";
import { createProcessBookmark } from "./process.js";
import {
  createWorkQueue,
  type QueuePriority,
  toQueuePriority,
} from "./queue.js";
import { shuffleInPlace } from "./shuffle.js";
import type { Pipeline, PipelineDeps, PipelineDoneEvent } from "./types.js";

export type { QueuePriority } from "./queue.js";
export type { Pipeline, PipelineDeps, PipelineDoneEvent } from "./types.js";

const DEFAULT_QUEUE_CONCURRENCY = 2;
const DEFAULT_RETRY_MAX_ATTEMPTS_EXCLUSIVE = 2;

export function createPipeline(deps: PipelineDeps): Pipeline {
  const queueConcurrency = deps.queueConcurrency ?? DEFAULT_QUEUE_CONCURRENCY;
  const retryMaxAttemptsExclusive =
    deps.retryMaxAttemptsExclusive ?? DEFAULT_RETRY_MAX_ATTEMPTS_EXCLUSIVE;

  const queue = createWorkQueue(queueConcurrency);
  const events = new EventEmitter();

  const processBookmark = createProcessBookmark({
    bookmarks: deps.bookmarks,
    llm: deps.llm,
    queue,
    events,
    retryMaxAttemptsExclusive,
  });

  function enqueue(bookmarkId: number, opts?: { priority?: QueuePriority }) {
    const priority = opts?.priority ?? "normal";
    logPipeline("debug", "queue.enqueue", {
      id: bookmarkId,
      priority,
      queueSizeBefore: queue.size,
      pending: queue.pending,
    });
    void queue.add(() => processBookmark(bookmarkId, 0), {
      priority: toQueuePriority(priority),
    });
  }

  async function recoverPending(): Promise<number> {
    const ids = await deps.bookmarks.listIdsByStatuses([
      "pending",
      "processing",
    ]);
    if (ids.length === 0) {
      logPipeline("info", "recover.none", {});
      return 0;
    }
    logPipeline("debug", "recover.start", { count: ids.length });
    shuffleInPlace(ids);
    for (const id of ids) {
      enqueue(id);
    }
    logPipeline("info", "recover.enqueued", { count: ids.length });
    return ids.length;
  }

  async function ingestUrl(input: {
    url: string;
    source: "channel" | "bot" | "manual";
    sourceChatId?: string | null;
    sourceMessageId?: string | null;
  }): Promise<{ id: number; duplicate: boolean; requeued: boolean }> {
    const normalizedUrl = normalizeUrl(input.url);
    const { kind } = classifyUrl(input.url);
    const mappedKind: "article" | "youtube" | "other" =
      kind === "youtube" ? "youtube" : kind === "article" ? "article" : "other";
    logPipeline("info", "ingest.received", {
      source: input.source,
      sourceChatId: input.sourceChatId ?? null,
      sourceMessageId: input.sourceMessageId ?? null,
      kind: mappedKind,
      url: input.url,
    });
    const existing = await deps.bookmarks.getByNormalizedUrl(normalizedUrl);
    if (existing) {
      logPipeline("debug", "ingest.duplicate", {
        id: existing.id,
        existingStatus: existing.status,
      });
      if (existing.status === "error") {
        return { id: existing.id, duplicate: true, requeued: false };
      }
      if (existing.status === "pending" || existing.status === "processing") {
        enqueue(existing.id);
        return { id: existing.id, duplicate: true, requeued: true };
      }
      return { id: existing.id, duplicate: true, requeued: false };
    }
    const id = await deps.bookmarks.insertPending({
      url: input.url,
      normalizedUrl,
      kind: mappedKind,
      source: input.source,
      sourceChatId: input.sourceChatId ?? null,
      sourceMessageId: input.sourceMessageId ?? null,
    });
    logPipeline("debug", "ingest.inserted", { id, kind: mappedKind });
    enqueue(id);
    return { id, duplicate: false, requeued: false };
  }

  function onDone(
    listener: (payload: PipelineDoneEvent) => void | Promise<void>,
  ): () => void {
    const wrapped = (payload: PipelineDoneEvent) => {
      Promise.resolve(listener(payload)).catch((err) => {
        logger.error({ err }, "pipeline done listener failed");
      });
    };
    events.on("done", wrapped);
    return () => events.off("done", wrapped);
  }

  return { enqueue, recoverPending, onDone, ingestUrl };
}
