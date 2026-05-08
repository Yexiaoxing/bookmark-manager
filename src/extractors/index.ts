import { logger } from "../logger.js";
import { fetchAndExtractArticleBrowser } from "./browser-fetcher.js";
import { tryExtractViaFxEmbed } from "./fxembed.js";
import { tryExtractViaHackerNewsApi } from "./hacker-news.js";
import { fetchAndExtractArticleHttp } from "./http-fetcher.js";
import type { ExtractedArticle } from "./types.js";
import { DeletedContentError } from "./types.js";

export type { ExtractedArticle } from "./types.js";
export { DeletedContentError } from "./types.js";

export async function fetchAndExtractArticle(
  url: string,
  signal?: AbortSignal,
): Promise<ExtractedArticle> {
  try {
    const fxExtracted = await tryExtractViaFxEmbed(url, signal);
    if (fxExtracted) {
      logger.debug({ url }, "used fxembed extraction for social post");
      return fxExtracted;
    }
  } catch (err) {
    logger.warn({ url, err }, "fxembed extraction failed, falling back");
  }
  try {
    const hnExtracted = await tryExtractViaHackerNewsApi(url, signal);
    if (hnExtracted) {
      logger.debug({ url }, "used hacker news api extraction");
      return hnExtracted;
    }
  } catch (err) {
    logger.warn(
      { url, err },
      "hacker news api extraction failed, falling back",
    );
  }

  try {
    return await fetchAndExtractArticleHttp(url, signal);
  } catch (err) {
    if (err instanceof DeletedContentError) {
      throw err;
    }
    logger.warn(
      { url, err },
      "http extraction failed, trying browser fallback",
    );
    try {
      return await fetchAndExtractArticleBrowser(url);
    } catch (browserErr) {
      logger.error(
        { url, err: browserErr },
        "browser fallback extraction failed",
      );
      throw err;
    }
  }
}
