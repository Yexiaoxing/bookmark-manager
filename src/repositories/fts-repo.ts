import { eq, sql } from "drizzle-orm";
import type { AppDb } from "../db/index.js";
import { bookmarks, youtubeMeta } from "../db/schema.js";

export function buildFtsQuery(userInput: string): string {
  const parts = userInput
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((p) => p.replace(/[^\w\-.@]/g, ""))
    .filter(Boolean);
  if (!parts.length) return "";
  return parts.map((p) => `"${p.replace(/"/g, '""')}*"`).join(" AND ");
}

export function createFtsRepo(db: AppDb) {
  async function refreshFtsRow(bookmarkId: number) {
    const [b] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, bookmarkId))
      .limit(1);
    if (!b) return;
    const [yt] = await db
      .select()
      .from(youtubeMeta)
      .where(eq(youtubeMeta.bookmarkId, bookmarkId))
      .limit(1);
    await db.run(sql`DELETE FROM bookmarks_fts WHERE rowid = ${bookmarkId}`);
    if (b.status !== "done") return;
    await db.run(
      sql`INSERT INTO bookmarks_fts(rowid, title, abstract, transcript, summary, tags_text) VALUES (${bookmarkId}, ${b.title ?? ""}, ${b.abstract ?? ""}, ${yt?.transcript ?? ""}, ${yt?.summary ?? ""}, ${b.tagsText ?? ""})`,
    );
  }

  return { refreshFtsRow };
}
