import type { BookmarksService } from "../services/bookmarks.js";
import type { LlmClient } from "../services/llm.js";
import type { QueuePriority } from "./queue.js";

export type PipelineDoneEvent = {
  id: number;
  url: string;
  source: string;
  sourceChatId: string | null;
  sourceMessageId?: string | null;
  title: string | null;
  abstract: string | null;
  abstractZh: string | null;
  error?: string | null;
  backlogCount?: number;
};

export type PipelineDeps = {
  bookmarks: BookmarksService;
  llm: LlmClient;
  /** P-queue concurrency; default 2 */
  queueConcurrency?: number;
  /**
   * Schedule another attempt while `attempt < this` (matches legacy `attempt < 2`).
   * Default 2 → attempts 0, 1, 2 run before terminal failure.
   */
  retryMaxAttemptsExclusive?: number;
};

export type Pipeline = {
  enqueue: (bookmarkId: number, opts?: { priority?: QueuePriority }) => void;
  recoverPending: () => Promise<number>;
  onDone: (
    listener: (payload: PipelineDoneEvent) => void | Promise<void>,
  ) => () => void;
  ingestUrl: (input: {
    url: string;
    source: "channel" | "bot" | "manual";
    sourceChatId?: string | null;
    sourceMessageId?: string | null;
  }) => Promise<{ id: number; duplicate: boolean; requeued: boolean }>;
};
