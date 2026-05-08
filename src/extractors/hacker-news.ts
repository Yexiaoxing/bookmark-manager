import { ARTICLE_BODY_READABILITY_MAX } from "../constants.js";
import { htmlToPlainText } from "../util/text.js";
import type { ExtractedArticle } from "./types.js";
import { EXTRACTOR_USER_AGENT } from "./user-agent.js";

function parseHackerNewsItemId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "news.ycombinator.com") return null;
    if (!parsed.pathname.startsWith("/item")) return null;
    const id = parsed.searchParams.get("id");
    if (!id || !/^\d+$/.test(id)) return null;
    return id;
  } catch {
    return null;
  }
}

function pickFirstString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function tryExtractViaHackerNewsApi(
  url: string,
  signal?: AbortSignal,
): Promise<ExtractedArticle | null> {
  const itemId = parseHackerNewsItemId(url);
  if (!itemId) return null;

  const apiUrl = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
  const res = await fetch(apiUrl, {
    signal,
    headers: {
      "User-Agent": EXTRACTOR_USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const item = payload as Record<string, unknown>;
  const title = pickFirstString(item.title) ?? `Hacker News #${itemId}`;
  const itemTextRaw = pickFirstString(item.text) ?? "";
  const itemText = itemTextRaw ? htmlToPlainText(itemTextRaw) : "";
  const byline = pickFirstString(item.by);
  const externalUrl = pickFirstString(item.url);
  const points = typeof item.score === "number" ? item.score : null;
  const comments =
    typeof item.descendants === "number" ? item.descendants : null;
  const type = pickFirstString(item.type);

  const lines = [
    title,
    byline ? `by ${byline}` : null,
    type ? `type: ${type}` : null,
    points != null ? `points: ${points}` : null,
    comments != null ? `comments: ${comments}` : null,
    externalUrl ? `link: ${externalUrl}` : null,
    itemText || null,
  ].filter((v): v is string => Boolean(v?.trim()));

  const textContent = lines.join("\n\n").slice(0, ARTICLE_BODY_READABILITY_MAX);
  if (!textContent) return null;
  return {
    title,
    textContent,
    excerpt: textContent.slice(0, 500),
    byline,
  };
}
