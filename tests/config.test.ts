import { afterEach, describe, expect, it } from "vitest";
import { loadConfig, parseAllowedUserIds } from "../src/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("parseAllowedUserIds", () => {
  it("returns empty set for empty input", () => {
    expect(parseAllowedUserIds("").size).toBe(0);
    expect(parseAllowedUserIds(undefined).size).toBe(0);
  });

  it("splits and trims user ids", () => {
    expect([...parseAllowedUserIds(" 1,2 , 2, 3 ")]).toEqual(["1", "2", "3"]);
  });
});

describe("loadConfig", () => {
  it("parses required env and applies defaults", () => {
    process.env.TELEGRAM_BOT_TOKEN = "token";
    process.env.TELEGRAM_CHANNEL_ID = "-100123";
    process.env.OPENAI_API_KEY = "key";

    const cfg = loadConfig();

    expect(cfg.OPENAI_BASE_URL).toBe("https://api.openai.com/v1");
    expect(cfg.HTTP_PORT).toBe(5173);
    expect(cfg.DATABASE_URL).toBe("./data/bookmarks.db");
    expect(cfg.QUEUE_CONCURRENCY).toBe(2);
    expect(cfg.RETRY_MAX_ATTEMPTS).toBe(2);
    expect(cfg.DONE_BATCH_DELAY_MS).toBe(5000);
    expect(cfg.DONE_BATCH_MAX_ITEMS).toBe(5);
  });

  it("strips trailing slash from OPENAI_BASE_URL", () => {
    process.env.TELEGRAM_BOT_TOKEN = "token";
    process.env.TELEGRAM_CHANNEL_ID = "-100123";
    process.env.OPENAI_API_KEY = "key";
    process.env.OPENAI_BASE_URL = "https://api.openai.com/v1/";

    const cfg = loadConfig();
    expect(cfg.OPENAI_BASE_URL).toBe("https://api.openai.com/v1");
  });

  it("supports cursor provider without OPENAI_API_KEY", () => {
    process.env.TELEGRAM_BOT_TOKEN = "token";
    process.env.TELEGRAM_CHANNEL_ID = "-100123";
    process.env.LLM_PROVIDER = "cursor";
    process.env.CURSOR_API_KEY = "cursor-key";

    const cfg = loadConfig();
    expect(cfg.LLM_PROVIDER).toBe("cursor");
    expect(cfg.CURSOR_MODEL).toBe("composer-2");
  });
});
