import { z } from "zod";

export const enrichSchema = z.object({
  abstract: z.string(),
  abstractZh: z.string().optional(),
  tags: z.array(z.string()).max(10).default([]),
  language: z.string().optional(),
});

export type EnrichParsed = z.infer<typeof enrichSchema>;

export type EnrichBookmarkInput = {
  url: string;
  title: string | null;
  bodyText: string;
  isYoutube: boolean;
};

export type LlmProvider = {
  enrichBookmarkRaw(input: EnrichBookmarkInput): Promise<string>;
  summarizeYoutubeTranscriptRaw(transcript: string): Promise<string>;
  repairJsonRaw(broken: string, modelId: string): Promise<string>;
};

export type LlmClient = {
  enrichBookmark(
    input: EnrichBookmarkInput,
  ): Promise<{ abstract: string; abstractZh: string; tags: string[] }>;
  summarizeYoutubeTranscript(transcript: string): Promise<string>;
};
