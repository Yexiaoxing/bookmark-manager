import { z } from "zod";

const envSchema = z
  .object({
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_CHANNEL_ID: z.string().min(1),
    TELEGRAM_ALLOWED_USER_IDS: z.string().optional(),
    LLM_PROVIDER: z.enum(["openai", "cursor"]).default("openai"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z
      .string()
      .default("https://api.openai.com/v1")
      .transform((s) => s.replace(/\/$/, "")),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_MODEL_LONG: z.string().default("gpt-4o-mini"),
    CURSOR_API_KEY: z.string().optional(),
    CURSOR_MODEL: z.string().default("composer-2"),
    CURSOR_MODEL_LONG: z.string().default("composer-2"),
    DATABASE_URL: z.string().default("./data/bookmarks.db"),
    HTTP_HOST: z.string().default("127.0.0.1"),
    HTTP_PORT: z.coerce.number().default(5173),
    PUBLIC_UI_BASE_URL: z
      .string()
      .optional()
      .transform((s) => s?.trim().replace(/\/+$/, "") || undefined),
    QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(2),
    RETRY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(2),
    DONE_BATCH_DELAY_MS: z.coerce.number().int().nonnegative().default(5000),
    DONE_BATCH_MAX_ITEMS: z.coerce.number().int().positive().default(5),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
      });
    }
    if (data.LLM_PROVIDER === "cursor" && !data.CURSOR_API_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CURSOR_API_KEY"],
        message: "CURSOR_API_KEY is required when LLM_PROVIDER=cursor",
      });
    }
  });

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  return envSchema.parse(process.env);
}

export function parseAllowedUserIds(raw?: string): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
