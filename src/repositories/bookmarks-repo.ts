import { desc, eq, inArray, sql } from "drizzle-orm";
import type { AppDb } from "../db/index.js";
import { bookmarks, bookmarkTags, tags, youtubeMeta } from "../db/schema.js";
import type {
  BookmarkKind,
  BookmarkRow,
  BookmarkSource,
  BookmarkStatus,
  BookmarkWithRelations,
} from "../services/bookmarks/types.js";

function nowMs() {
  return Date.now();
}

export function createBookmarksRepo(db: AppDb) {
  async function loadRelations(
    rows: BookmarkRow[],
  ): Promise<BookmarkWithRelations[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const tagRows = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        name: tags.name,
      })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(inArray(bookmarkTags.bookmarkId, ids));
    const byBm = new Map<number, string[]>();
    for (const tr of tagRows) {
      const arr = byBm.get(tr.bookmarkId) ?? [];
      arr.push(tr.name);
      byBm.set(tr.bookmarkId, arr);
    }
    const ytRows = await db
      .select()
      .from(youtubeMeta)
      .where(inArray(youtubeMeta.bookmarkId, ids));
    const ytBy = new Map(ytRows.map((y) => [y.bookmarkId, y]));
    return rows.map((r) => ({
      ...r,
      tagNames: byBm.get(r.id) ?? [],
      youtube: ytBy.get(r.id) ?? null,
    }));
  }

  async function getById(id: number): Promise<BookmarkWithRelations | null> {
    const [row] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id))
      .limit(1);
    if (!row) return null;
    const [withRels] = await loadRelations([row]);
    return withRels ?? null;
  }

  async function getByNormalizedUrl(
    normalizedUrl: string,
  ): Promise<BookmarkRow | null> {
    const [row] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.normalizedUrl, normalizedUrl))
      .limit(1);
    return row ?? null;
  }

  async function insertPending(input: {
    url: string;
    normalizedUrl: string;
    kind: BookmarkKind;
    source: BookmarkSource;
    sourceChatId?: string | null;
    sourceMessageId?: string | null;
  }): Promise<number> {
    const t = nowMs();
    const ins = await db
      .insert(bookmarks)
      .values({
        url: input.url,
        normalizedUrl: input.normalizedUrl,
        kind: input.kind,
        source: input.source,
        sourceChatId: input.sourceChatId ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        status: "pending",
        createdAt: new Date(t),
        updatedAt: new Date(t),
      })
      .returning();
    const inserted = ins[0];
    if (!inserted) {
      throw new Error("Failed to insert bookmark");
    }
    return inserted.id;
  }

  async function markStatus(
    id: number,
    status: BookmarkStatus,
    error?: string | null,
  ) {
    await db
      .update(bookmarks)
      .set({
        status,
        error: error ?? null,
        updatedAt: new Date(nowMs()),
      })
      .where(eq(bookmarks.id, id));
  }

  async function updateProcessedBookmark(input: {
    id: number;
    title: string | null;
    abstract: string | null;
    abstractZh: string | null;
    kind: BookmarkKind;
  }) {
    await db
      .update(bookmarks)
      .set({
        title: input.title,
        abstract: input.abstract,
        abstractZh: input.abstractZh,
        kind: input.kind,
        status: "done",
        error: null,
        updatedAt: new Date(nowMs()),
      })
      .where(eq(bookmarks.id, input.id));
  }

  async function patchBookmark(
    id: number,
    patch: {
      title?: string | null;
      abstract?: string | null;
      abstractZh?: string | null;
    },
  ) {
    const updates: Partial<typeof bookmarks.$inferInsert> = {
      updatedAt: new Date(nowMs()),
    };
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.abstract !== undefined) updates.abstract = patch.abstract;
    if (patch.abstractZh !== undefined) updates.abstractZh = patch.abstractZh;
    if (Object.keys(updates).length > 1) {
      await db.update(bookmarks).set(updates).where(eq(bookmarks.id, id));
    }
  }

  async function deleteBookmark(id: number) {
    await db.run(sql`DELETE FROM bookmarks_fts WHERE rowid = ${id}`);
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }

  async function recentIds(n: number): Promise<number[]> {
    const rows = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .orderBy(desc(bookmarks.id))
      .limit(n);
    return rows.map((r) => r.id);
  }

  async function listIdsByStatuses(
    statuses: BookmarkStatus[],
  ): Promise<number[]> {
    if (!statuses.length) return [];
    const rows = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(inArray(bookmarks.status, statuses))
      .orderBy(desc(bookmarks.id));
    return rows.map((r) => r.id);
  }

  return {
    loadRelations,
    getById,
    getByNormalizedUrl,
    insertPending,
    markStatus,
    updateProcessedBookmark,
    patchBookmark,
    deleteBookmark,
    recentIds,
    listIdsByStatuses,
  };
}

export type BookmarksRepo = ReturnType<typeof createBookmarksRepo>;
