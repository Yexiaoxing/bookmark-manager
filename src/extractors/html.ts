import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import {
  ARTICLE_BODY_FALLBACK_MAX,
  ARTICLE_BODY_READABILITY_MAX,
} from "../constants.js";
import { htmlToPlainText } from "../util/text.js";
import type { ExtractedArticle } from "./types.js";

export function extractFromHtml(
  html: string,
  sourceUrl: string,
): ExtractedArticle {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (err) => {
    if (
      err.message.includes("Could not parse CSS stylesheet") ||
      err.message.includes("did not match the Name production")
    ) {
      return;
    }
  });
  try {
    const dom = new JSDOM(html, { url: sourceUrl, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) {
      const title =
        dom.window.document.querySelector("title")?.textContent?.trim() ?? null;
      const body =
        dom.window.document.body?.textContent?.replace(/\s+/g, " ").trim() ??
        "";
      return {
        title,
        textContent: body.slice(0, ARTICLE_BODY_FALLBACK_MAX),
        excerpt: body.slice(0, 500),
        byline: null,
      };
    }
    const textContent = article.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return {
      title: article.title ?? null,
      textContent: textContent.slice(0, ARTICLE_BODY_READABILITY_MAX),
      excerpt: article.excerpt ?? null,
      byline: article.byline ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("did not match the Name production")) {
      throw err;
    }
    const body = htmlToPlainText(html);
    return {
      title: null,
      textContent: body.slice(0, ARTICLE_BODY_FALLBACK_MAX),
      excerpt: body.slice(0, 500),
      byline: null,
    };
  }
}
