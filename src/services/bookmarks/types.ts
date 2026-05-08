import type { bookmarks, youtubeMeta } from "../../db/schema.js";

export type BookmarkSource = "channel" | "bot" | "manual";
export type BookmarkKind = "article" | "youtube" | "other";
export type BookmarkStatus =
  | "pending"
  | "processing"
  | "done"
  | "error"
  | "deleted";

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type YoutubeMetaRow = typeof youtubeMeta.$inferSelect;

export type BookmarkWithRelations = BookmarkRow & {
  tagNames: string[];
  youtube: YoutubeMetaRow | null;
};
