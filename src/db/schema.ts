import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  normalizedUrl: text("normalized_url").notNull().unique(),
  title: text("title"),
  abstract: text("abstract"),
  abstractZh: text("abstract_zh"),
  kind: text("kind").notNull().default("other"), // article | youtube | other
  source: text("source").notNull(), // channel | bot | manual
  sourceChatId: text("source_chat_id"),
  sourceMessageId: text("source_message_id"),
  status: text("status").notNull().default("pending"), // pending | processing | done | error
  error: text("error"),
  tagsText: text("tags_text"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const bookmarkTags = sqliteTable(
  "bookmark_tags",
  {
    bookmarkId: integer("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bookmarkId, t.tagId] }),
  }),
);

export const youtubeMeta = sqliteTable("youtube_meta", {
  bookmarkId: integer("bookmark_id")
    .primaryKey()
    .references(() => bookmarks.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  channel: text("channel"),
  durationSec: integer("duration_sec"),
  transcript: text("transcript"),
  transcriptLang: text("transcript_lang"),
  summary: text("summary"),
});

export const bookmarksRelations = relations(bookmarks, ({ many, one }) => ({
  bookmarkTags: many(bookmarkTags),
  youtubeMeta: one(youtubeMeta),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));

export const youtubeMetaRelations = relations(youtubeMeta, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [youtubeMeta.bookmarkId],
    references: [bookmarks.id],
  }),
}));

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
