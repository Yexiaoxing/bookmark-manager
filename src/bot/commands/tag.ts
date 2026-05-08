import type { Context } from "grammy";
import type { BotCommandDeps } from "./types.js";

function parseIntSafe(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function createTagCommand(deps: BotCommandDeps) {
  return async function handleTag(ctx: Context) {
    const parts = (ctx.message?.text ?? "").trim().split(/\s+/);
    const id = parseIntSafe(parts[1]);
    if (id == null || parts.length < 3) {
      await ctx.reply("Usage: /tag <id> <tag1> [tag2] ...");
      return;
    }
    const bm = await deps.bookmarks.getById(id);
    if (!bm) {
      await ctx.reply("Bookmark not found.");
      return;
    }
    const add = parts
      .slice(2)
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean);
    const merged = [...new Set([...bm.tagNames, ...add])];
    await deps.bookmarks.patchBookmark(id, { tagNames: merged });
    await ctx.reply(`Updated tags on #${id}: ${merged.join(", ")}`);
  };
}
