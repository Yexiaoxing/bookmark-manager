import type { BookmarkRow } from "../../services/bookmarks.js";
import { fetchAndExtractArticle } from "../../services/extractor.js";

export async function prepareArticleContent(
  bm: BookmarkRow,
  url: string,
): Promise<{ title: string | null; bodyText: string }> {
  let title: string | null = bm.title ?? null;
  const extracted = await fetchAndExtractArticle(url);
  title = extracted.title ?? title;
  const bodyText = [
    extracted.title,
    extracted.byline,
    extracted.excerpt,
    extracted.textContent,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { title, bodyText };
}
