import { eq } from "drizzle-orm";
import type { AppDb } from "../db/index.js";
import { bookmarks, bookmarkTags, tags } from "../db/schema.js";

function nowMs() {
  return Date.now();
}

export function createTagsRepo(
  db: AppDb,
  fts: { refreshFtsRow(bookmarkId: number): Promise<void> },
) {
  async function ensureTagIds(names: string[]): Promise<number[]> {
    const ids: number[] = [];
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const existing = await db
        .select()
        .from(tags)
        .where(eq(tags.name, name))
        .limit(1);
      if (existing[0]) {
        ids.push(existing[0].id);
        continue;
      }
      const ins = await db.insert(tags).values({ name }).returning();
      const inserted = ins[0];
      if (!inserted) {
        throw new Error("Failed to insert tag");
      }
      ids.push(inserted.id);
    }
    return ids;
  }

  async function setBookmarkTags(bookmarkId: number, tagNames: string[]) {
    await db
      .delete(bookmarkTags)
      .where(eq(bookmarkTags.bookmarkId, bookmarkId));
    const ids = await ensureTagIds(tagNames);
    if (ids.length) {
      await db
        .insert(bookmarkTags)
        .values(ids.map((tagId) => ({ bookmarkId, tagId })));
    }
    const tagsText = tagNames.join(" ");
    await db
      .update(bookmarks)
      .set({ tagsText, updatedAt: new Date(nowMs()) })
      .where(eq(bookmarks.id, bookmarkId));
    await fts.refreshFtsRow(bookmarkId);
  }

  return { ensureTagIds, setBookmarkTags };
}
