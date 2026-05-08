import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { AppDb } from "../../db/index.js";
import { bookmarks, bookmarkTags, tags } from "../../db/schema.js";
import { buildFtsQuery } from "../../repositories/fts-repo.js";
import type {
  BookmarkKind,
  BookmarkRow,
  BookmarkStatus,
  BookmarkWithRelations,
} from "./types.js";

export async function listBookmarks(
  db: AppDb,
  loadRelations: (rows: BookmarkRow[]) => Promise<BookmarkWithRelations[]>,
  input: {
    query?: string;
    tag?: string;
    kind?: BookmarkKind;
    status?: BookmarkStatus;
    cursor?: number;
    limit?: number;
  },
): Promise<{ items: BookmarkWithRelations[]; nextCursor: number | null }> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const conds: ReturnType<typeof sql>[] = [];

  if (input.cursor != null) {
    conds.push(sql`${bookmarks.id} < ${input.cursor}`);
  }
  if (input.kind) {
    conds.push(eq(bookmarks.kind, input.kind));
  }
  if (input.status) {
    conds.push(eq(bookmarks.status, input.status));
  }
  if (input.tag?.trim()) {
    const tagName = input.tag.trim();
    const sub = db
      .select({ id: bookmarkTags.bookmarkId })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(eq(tags.name, tagName));
    conds.push(inArray(bookmarks.id, sub));
  }
  if (input.query?.trim()) {
    const query = input.query.trim();
    const fts = buildFtsQuery(query);
    const likePattern = `%${query}%`;
    if (fts) {
      conds.push(
        sql`(
            ${bookmarks.id} IN (SELECT rowid FROM bookmarks_fts WHERE bookmarks_fts MATCH ${fts})
            OR ${bookmarks.url} LIKE ${likePattern}
            OR ${bookmarks.normalizedUrl} LIKE ${likePattern}
          )`,
      );
    } else {
      conds.push(
        sql`(
            ${bookmarks.url} LIKE ${likePattern}
            OR ${bookmarks.normalizedUrl} LIKE ${likePattern}
          )`,
      );
    }
  }

  const where = conds.length > 0 ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(bookmarks)
    .where(where)
    .orderBy(desc(bookmarks.id))
    .limit(limit + 1);

  let nextCursor: number | null = null;
  if (rows.length > limit) {
    const last = rows.pop();
    nextCursor = last ? last.id : null;
  }
  return { items: await loadRelations(rows), nextCursor };
}
