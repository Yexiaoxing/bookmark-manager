import OpenAI from "openai";
import type { Config } from "../../config.js";
import {
  buildEnrichOpenAiUserPrompt,
  ENRICH_SYSTEM_PROMPT,
  YOUTUBE_SUMMARY_SYSTEM_PROMPT,
} from "../prompts.js";
import type { EnrichBookmarkInput, LlmProvider } from "../types.js";
import { ChatCompletionMessage } from "openai/resources/chat/completions/completions.mjs";

const getContent = (message: ChatCompletionMessage): string => {
  // @ts-ignore reasoning_content is for thinking models
  return message.content ?? message.reasoning_content ?? "";
};

export function createOpenAiProvider(config: Config): LlmProvider {
  const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_BASE_URL,
  });

  return {
    async enrichBookmarkRaw(input: EnrichBookmarkInput): Promise<string> {
      const res = await client.chat.completions.create({
        model: config.OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ENRICH_SYSTEM_PROMPT },
          { role: "user", content: buildEnrichOpenAiUserPrompt(input) },
        ],
        temperature: 0.3,
      });
      return getContent(res.choices[0]?.message) ?? "";
    },

    async summarizeYoutubeTranscriptRaw(transcript: string): Promise<string> {
      const res = await client.chat.completions.create({
        model: config.OPENAI_MODEL_LONG,
        messages: [
          { role: "system", content: YOUTUBE_SUMMARY_SYSTEM_PROMPT },
          { role: "user", content: transcript },
        ],
        temperature: 0.35,
      });
      return getContent(res.choices[0]?.message).trim();
    },

    async repairJsonRaw(broken: string, modelId: string): Promise<string> {
      const res = await client.chat.completions.create({
        model: modelId,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You repair malformed JSON. Return strictly valid JSON only.",
          },
          {
            role: "user",
            content: `Repair this JSON-like text into valid JSON while preserving meaning:\n\n${broken}`,
          },
        ],
        temperature: 0,
      });
      return getContent(res.choices[0]?.message).trim();
    },
  };
}
