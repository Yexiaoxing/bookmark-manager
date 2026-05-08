import { logger } from "../logger.js";
import { extractFromHtml } from "./html.js";
import { classifyFetchNetworkError } from "./network-errors.js";
import type { ExtractedArticle } from "./types.js";
import { DeletedContentError } from "./types.js";
import { EXTRACTOR_USER_AGENT } from "./user-agent.js";
import { isWechatDeletedHtml, isWechatHost } from "./wechat.js";

export async function fetchAndExtractArticleHttp(
  url: string,
  signal?: AbortSignal,
): Promise<ExtractedArticle> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal,
      headers: {
        "User-Agent": EXTRACTOR_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    const classified = classifyFetchNetworkError(err);
    if (classified) {
      logger.error(
        {
          url,
          err,
          fetchErrorKind: classified.kind,
          fetchErrorCode: classified.code ?? null,
        },
        "article fetch request failed with classified network error",
      );
      if (classified.kind === "dns_nxdomain") {
        throw new Error("Fetch failed: DNS NXDOMAIN (host not found)");
      }
      if (classified.kind === "cert_issue") {
        throw new Error("Fetch failed: TLS certificate issue");
      }
      throw new Error(
        `Fetch failed: network error${classified.code ? ` (${classified.code})` : ""}`,
      );
    }
    logger.error(
      {
        url,
        err,
      },
      "article fetch request failed",
    );
    throw err;
  }
  if (res.status === 404) {
    logger.info(
      { url, status: 404 },
      "article fetch indicates deleted content",
    );
    throw new DeletedContentError("HTTP 404 page not found");
  }
  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? null;
    let snippet: string | null = null;
    try {
      snippet = (await res.text()).replace(/\s+/g, " ").trim().slice(0, 400);
    } catch {
      // ignore body read failures; we still log status metadata
    }
    logger.error(
      {
        url,
        finalUrl: res.url,
        status: res.status,
        statusText: res.statusText,
        contentType,
        responseSnippet: snippet,
      },
      "article fetch returned non-ok response",
    );
    throw new Error(
      `HTTP ${res.status} ${res.statusText || ""} fetching page`.trim(),
    );
  }
  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
    const buf = await res.arrayBuffer();
    const snippet = new TextDecoder().decode(buf.slice(0, 2000));
    return {
      title: url,
      textContent: snippet,
      excerpt: null,
      byline: null,
    };
  }
  const html = await res.text();
  if (isWechatHost(res.url || url) && isWechatDeletedHtml(html)) {
    throw new DeletedContentError("WeChat article deleted");
  }
  return extractFromHtml(html, url);
}
