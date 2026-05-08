import { desc, eq, sql } from "drizzle-orm";
import type { AppDb } from "../../db/index.js";
import { bookmarkTags, tags } from "../../db/schema.js";
import { createBookmarksRepo } from "../../repositories/bookmarks-repo.js";
import { createFtsRepo } from "../../repositories/fts-repo.js";
import { createTagsRepo } from "../../repositories/tagsRepo.js";
import { createYoutubeMetaRepo } from "../../repositories/youtube-meta-repo.js";
import { listBookmarks as listBookmarksQuery } from "./list-bookmarks.js";
import type { BookmarkKind } from "./types.js";

export type {
  BookmarkKind,
  BookmarkRow,
  BookmarkSource,
  BookmarkStatus,
  BookmarkWithRelations,
  YoutubeMetaRow,
} from "./types.js";

export function createBookmarksService(db: AppDb) {
  const fts = createFtsRepo(db);
  const tagsRepo = createTagsRepo(db, fts);
  const youtubeMetaRepo = createYoutubeMetaRepo(db);
  const bookmarksRepo = createBookmarksRepo(db);

  async function saveProcessed(input: {
    id: number;
    title: string | null;
    abstract: string | null;
    abstractZh: string | null;
    kind: BookmarkKind;
    tagNames: string[];
    youtube?: {
      videoId: string;
      channel: string | null;
      durationSec: number | null;
      transcript: string | null;
      transcriptLang: string | null;
      summary: string | null;
    } | null;
  }) {
    await bookmarksRepo.updateProcessedBookmark({
      id: input.id,
      title: input.title,
      abstract: input.abstract,
      abstractZh: input.abstractZh,
      kind: input.kind,
    });

    if (input.youtube) {
      await youtubeMetaRepo.upsertForBookmark(input.id, input.youtube);
    }

    await tagsRepo.setBookmarkTags(input.id, input.tagNames);
    await fts.refreshFtsRow(input.id);
  }

  async function listAllTags(): Promise<{ name: string; count: number }[]> {
    const res = await db
      .select({
        name: tags.name,
        count: sql<number>`count(distinct ${bookmarkTags.bookmarkId})`.mapWith(
          Number,
        ),
      })
      .from(tags)
      .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
      .groupBy(tags.id)
      .orderBy(desc(sql<number>`count(distinct ${bookmarkTags.bookmarkId})`));
    return res;
  }

  async function patchBookmark(
    id: number,
    patch: {
      title?: string | null;
      abstract?: string | null;
      abstractZh?: string | null;
      tagNames?: string[];
    },
  ) {
    await bookmarksRepo.patchBookmark(id, {
      title: patch.title,
      abstract: patch.abstract,
      abstractZh: patch.abstractZh,
    });
    if (patch.tagNames) {
      await tagsRepo.setBookmarkTags(id, patch.tagNames);
    } else if (
      patch.title !== undefined ||
      patch.abstract !== undefined ||
      patch.abstractZh !== undefined
    ) {
      await fts.refreshFtsRow(id);
    }
  }

  return {
    refreshFtsRow: fts.refreshFtsRow,
    getById: bookmarksRepo.getById,
    getByNormalizedUrl: bookmarksRepo.getByNormalizedUrl,
    insertPending: bookmarksRepo.insertPending,
    markStatus: bookmarksRepo.markStatus,
    saveProcessed,
    listBookmarks: (input: Parameters<typeof listBookmarksQuery>[2]) =>
      listBookmarksQuery(db, bookmarksRepo.loadRelations, input),
    listAllTags,
    patchBookmark,
    deleteBookmark: bookmarksRepo.deleteBookmark,
    recentIds: bookmarksRepo.recentIds,
    listIdsByStatuses: bookmarksRepo.listIdsByStatuses,
    setBookmarkTags: tagsRepo.setBookmarkTags,
    loadRelations: bookmarksRepo.loadRelations,
  };
}

export type BookmarksService = ReturnType<typeof createBookmarksService>;
