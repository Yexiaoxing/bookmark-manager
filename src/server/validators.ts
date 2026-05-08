import type { BookmarkKind, BookmarkStatus } from "../services/bookmarks.js";

export function parseOptionalBookmarkKind(
  raw: string | undefined,
): BookmarkKind | undefined {
  if (raw === "article" || raw === "youtube" || raw === "other") return raw;
  return undefined;
}

export function parseOptionalBookmarkStatus(
  raw: string | undefined,
): BookmarkStatus | undefined {
  if (
    raw === "pending" ||
    raw === "processing" ||
    raw === "done" ||
    raw === "error" ||
    raw === "deleted"
  ) {
    return raw;
  }
  return undefined;
}
