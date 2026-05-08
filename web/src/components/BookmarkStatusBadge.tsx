import type { BookmarkStatus } from "../api";

export function BookmarkStatusBadge({ status }: { status: BookmarkStatus }) {
  const cls =
    status === "done"
      ? "bg-emerald-950 text-emerald-300"
      : status === "error"
        ? "bg-red-950 text-red-300"
        : status === "deleted"
          ? "bg-zinc-800 text-zinc-300"
          : "bg-amber-950 text-amber-200";
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${cls}`}>{status}</span>
  );
}
