import PQueue from "p-queue";

export type QueuePriority = "high" | "normal" | "low";

export function toQueuePriority(priority: QueuePriority): number {
  if (priority === "high") return 10;
  if (priority === "normal") return 0;
  if (priority === "low") return -10;
  return 0;
}

export function createWorkQueue(concurrency: number): PQueue {
  return new PQueue({ concurrency });
}
