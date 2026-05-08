import { ARTICLE_BODY_READABILITY_MAX } from "../constants.js";
import { mapRelayUrl } from "../services/url.js";
import { EXTRACTOR_USER_AGENT } from "./user-agent.js";

type FxEmbedExtract = {
  title: string | null;
  textContent: string;
  excerpt: string | null;
  byline: string | null;
};

function parseTwitterStatusId(url: string): string | null {
  try {
    const parsed = new URL(mapRelayUrl(url));
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (
      host !== "x.com" &&
      host !== "twitter.com" &&
      host !== "mobile.twitter.com"
    ) {
      return null;
    }
    const m = parsed.pathname.match(/\/[^/]+\/status\/(\d+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseBlueskyHandleAndRkey(
  url: string,
): { handle: string; rkey: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "bsky.app") return null;
    const m = parsed.pathname.match(/\/profile\/([^/]+)\/post\/([^/]+)/i);
    if (!m?.[1] || !m?.[2]) return null;
    return { handle: decodeURIComponent(m[1]), rkey: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

async function fetchFxEmbedJson(
  apiUrl: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const res = await fetch(apiUrl, {
    signal,
    headers: {
      "User-Agent": EXTRACTOR_USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickFirstString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function fxStatusToExtract(
  data: unknown,
  sourceUrl: string,
): FxEmbedExtract | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const status = (root.status as Record<string, unknown> | undefined) ?? null;
  if (!status) return null;

  const text = pickFirstString(status.text) ?? "";
  if (!text) return null;
  const author =
    status.author && typeof status.author === "object"
      ? (status.author as Record<string, unknown>)
      : null;
  const authorName =
    pickFirstString(author?.name) ?? pickFirstString(author?.screen_name);
  const title = authorName ? `${authorName} on social` : sourceUrl;
  return {
    title,
    textContent: text.slice(0, ARTICLE_BODY_READABILITY_MAX),
    excerpt: text.slice(0, 500),
    byline: authorName ?? null,
  };
}

export async function tryExtractViaFxEmbed(
  url: string,
  signal?: AbortSignal,
): Promise<FxEmbedExtract | null> {
  const twitterStatusId = parseTwitterStatusId(url);
  if (twitterStatusId) {
    const apiUrl = `https://api.fxtwitter.com/2/status/${encodeURIComponent(twitterStatusId)}`;
    const payload = await fetchFxEmbedJson(apiUrl, signal);
    const extracted = fxStatusToExtract(payload, url);
    if (extracted) return extracted;
  }

  const bluesky = parseBlueskyHandleAndRkey(url);
  if (bluesky) {
    const apiUrl = `https://api.fxbsky.app/2/status/${encodeURIComponent(bluesky.handle)}/${encodeURIComponent(bluesky.rkey)}`;
    const payload = await fetchFxEmbedJson(apiUrl, signal);
    const extracted = fxStatusToExtract(payload, url);
    if (extracted) return extracted;
  }

  return null;
}
