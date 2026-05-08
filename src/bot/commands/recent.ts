import type { Context } from "grammy";
import { TELEGRAM_MAX_MESSAGE_CHARS } from "../../constants.js";
import type { BotCommandDeps } from "./types.js";

function parseIntSafe(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function createRecentCommand(deps: BotCommandDeps) {
  return async function handleRecent(ctx: Context) {
    const parts = (ctx.message?.text ?? "").trim().split(/\s+/);
    const n = parseIntSafe(parts[1]) ?? 10;
    const limit = Math.min(Math.max(n, 1), 20);
    const { items } = await deps.bookmarks.listBookmarks({ limit });
    if (!items.length) {
      await ctx.reply("No bookmarks yet.");
      return;
    }
    const lines = items.map((b) => {
      const title = (b.title ?? b.url).trim();
      const abstractEn = (b.abstract ?? "").trim();
      const abstractZh = (b.abstractZh ?? "").trim();
      return [
        `#${b.id} ${title}`,
        `EN: ${abstractEn || "—"}`,
        `ZH: ${abstractZh || "—"}`,
      ].join("\n");
    });
    await ctx.reply(lines.join("\n\n").slice(0, TELEGRAM_MAX_MESSAGE_CHARS));
  };
}
