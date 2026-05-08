/** Telegram Bot API message length safety margin below 4096. */
export const TELEGRAM_MAX_MESSAGE_CHARS = 4090;

/** Max plain text / fallback body slice for article extraction (non-readability path). */
export const ARTICLE_BODY_FALLBACK_MAX = 50_000;

/** Max text content from Readability extraction. */
export const ARTICLE_BODY_READABILITY_MAX = 80_000;

/** LLM input truncation for bookmark enrichment. */
export const LLM_ENRICH_BODY_MAX = 24_000;

/** LLM input truncation for YouTube transcript summary. */
export const LLM_YOUTUBE_TRANSCRIPT_MAX = 100_000;
