import { logger } from "../logger.js";

export function logPipeline(
  severity: "debug" | "info" | "warn" | "error",
  event: string,
  data: Record<string, unknown>,
) {
  const labels: Record<string, string> = {
    "process.start": "Processing started",
    "process.skip.missing": "Skipped missing bookmark",
    "process.skip.done": "Skipped already completed bookmark",
    "process.classified": "URL classified",
    "process.enriched": "Content enriched",
    "process.done": "Processing completed",
    "process.retry.waiting": "Waiting before retry",
    "process.retry.scheduled": "Retry scheduled",
    "process.deleted": "Marked as deleted content",
    "process.failed": "Processing failed",
    "queue.enqueue": "Bookmark queued",
    "ingest.received": "Ingestion request received",
    "ingest.duplicate": "Duplicate bookmark detected",
    "ingest.inserted": "Bookmark inserted",
    "recover.none": "No pending backlog to recover",
    "recover.start": "Recovering pending backlog",
    "recover.enqueued": "Recovered backlog enqueued",
  };
  const label = labels[event] ?? event;
  logger[severity](data, `pipeline: ${label}`);
}
