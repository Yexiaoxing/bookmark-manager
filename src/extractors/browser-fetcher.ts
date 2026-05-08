import { logger } from "../logger.js";
import { extractFromHtml } from "./html.js";
import type { ExtractedArticle } from "./types.js";
import { DeletedContentError } from "./types.js";
import { EXTRACTOR_USER_AGENT } from "./user-agent.js";
import { isWechatDeletedHtml, isWechatHost } from "./wechat.js";

export async function fetchAndExtractArticleBrowser(
  url: string,
): Promise<ExtractedArticle> {
  const { chromium } = await import("playwright");
  logger.debug({ url }, "launching browser for article extraction");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: EXTRACTOR_USER_AGENT,
      locale: "en-US",
    });
    logger.debug({ url }, "created browser context");
    const page = await context.newPage();
    logger.debug({ url }, "created browser page");
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    const status = response?.status() ?? null;
    if (status != null && status >= 400) {
      throw new Error(`HTTP ${status} from browser navigation`);
    }
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    logger.debug({ url }, "navigated to final URL");
    const html = await page.content();
    logger.debug({ url }, "fetched HTML content");
    if (isWechatHost(finalUrl || url) && isWechatDeletedHtml(html)) {
      throw new DeletedContentError("WeChat article deleted");
    }
    return extractFromHtml(html, finalUrl || url);
  } finally {
    await browser.close();
  }
}
