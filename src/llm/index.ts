import type { Config } from "../config.js";
import {
  LLM_ENRICH_BODY_MAX,
  LLM_YOUTUBE_TRANSCRIPT_MAX,
} from "../constants.js";
import { logger } from "../logger.js";
import { extractLikelyJson } from "./json-repair.js";
import { createCursorProvider } from "./providers/cursor.js";
import { createOpenAiProvider } from "./providers/openai.js";
import {
  type EnrichBookmarkInput,
  enrichSchema,
  type LlmClient,
  type LlmProvider,
} from "./types.js";

export type { LlmClient } from "./types.js";

function normalizeTag(t: string): string {
  return t
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function createLlmClient(config: Config): LlmClient {
  const provider: LlmProvider =
    config.LLM_PROVIDER === "openai"
      ? createOpenAiProvider(config)
      : createCursorProvider(config);

  const repairModelId =
    config.LLM_PROVIDER === "openai"
      ? config.OPENAI_MODEL
      : config.CURSOR_MODEL;

  async function enrichBookmark(input: EnrichBookmarkInput): Promise<{
    abstract: string;
    abstractZh: string;
    tags: string[];
  }> {
    const truncatedInput: EnrichBookmarkInput = {
      ...input,
      bodyText: input.bodyText.slice(0, LLM_ENRICH_BODY_MAX),
    };
    const raw = await provider.enrichBookmarkRaw(truncatedInput);
    if (!raw) throw new Error("Empty LLM response");
    let parsed: ReturnType<typeof enrichSchema.parse>;
    try {
      parsed = enrichSchema.parse(JSON.parse(raw));
    } catch (err) {
      logger.warn(
        { err },
        "llm enrich response json parse failed, retrying parse",
      );
      const maybeJson = extractLikelyJson(raw);
      try {
        parsed = enrichSchema.parse(JSON.parse(maybeJson));
      } catch {
        const repairedRaw = await provider.repairJsonRaw(
          maybeJson,
          repairModelId,
        );
        parsed = enrichSchema.parse(JSON.parse(extractLikelyJson(repairedRaw)));
      }
    }
    const rawTags = parsed.tags?.length ? parsed.tags : ["link"];
    const tags = [...new Set(rawTags.map(normalizeTag).filter(Boolean))].slice(
      0,
      8,
    );
    const abstract = parsed.abstract.trim();
    const abstractZh = (parsed.abstractZh ?? abstract).trim();
    return { abstract, abstractZh, tags };
  }

  async function summarizeYoutubeTranscript(
    transcript: string,
  ): Promise<string> {
    const truncated = transcript.slice(0, LLM_YOUTUBE_TRANSCRIPT_MAX);
    const text = await provider.summarizeYoutubeTranscriptRaw(truncated);
    if (!text) throw new Error("Empty summary response");
    return text;
  }

  return { enrichBookmark, summarizeYoutubeTranscript };
}
