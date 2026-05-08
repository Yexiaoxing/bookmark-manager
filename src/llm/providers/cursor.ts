import { Agent } from "@cursor/sdk";
import type { Config } from "../../config.js";
import {
  buildEnrichCursorPrompt,
  YOUTUBE_SUMMARY_SYSTEM_PROMPT,
} from "../prompts.js";
import type { EnrichBookmarkInput, LlmProvider } from "../types.js";

async function promptCursor(
  config: Config,
  message: string,
  modelId: string,
): Promise<string> {
  const run = await Agent.prompt(message, {
    apiKey: config.CURSOR_API_KEY,
    model: { id: modelId },
    local: { cwd: process.cwd() },
  });
  if (run.status !== "finished") {
    throw new Error(`Cursor SDK run failed with status=${run.status}`);
  }
  if (!run.result?.trim()) {
    throw new Error("Empty Cursor SDK response");
  }
  return run.result.trim();
}

export function createCursorProvider(config: Config): LlmProvider {
  return {
    async enrichBookmarkRaw(input: EnrichBookmarkInput): Promise<string> {
      return promptCursor(
        config,
        buildEnrichCursorPrompt(input),
        config.CURSOR_MODEL,
      );
    },

    async summarizeYoutubeTranscriptRaw(transcript: string): Promise<string> {
      return promptCursor(
        config,
        [YOUTUBE_SUMMARY_SYSTEM_PROMPT, "Transcript:", transcript].join("\n\n"),
        config.CURSOR_MODEL_LONG,
      );
    },

    async repairJsonRaw(broken: string, modelId: string): Promise<string> {
      return promptCursor(
        config,
        [
          "You repair malformed JSON.",
          "Return ONLY strictly valid JSON. No markdown.",
          broken,
        ].join("\n\n"),
        modelId,
      );
    },
  };
}
