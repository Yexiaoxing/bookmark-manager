import type { BookmarkRow } from "../../services/bookmarks.js";

export function prepareOtherContent(
  bm: BookmarkRow,
  url: string,
): {
  title: string | null;
  bodyText: string;
} {
  return {
    title: bm.title ?? null,
    bodyText: url,
  };
}
