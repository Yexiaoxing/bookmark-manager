import type { Context } from "grammy";
import type { BotCommandDeps } from "./types.js";

export function createSearchCommand(deps: BotCommandDeps) {
  return async function handleSearch(ctx: Context) {
    const q = (ctx.message?.text ?? "")
      .trim()
      .split(/\s+/)
      .slice(1)
      .join(" ")
      .trim();
    if (!q) {
      await ctx.reply("Usage: /search <query>");
      return;
    }
    const { items } = await deps.bookmarks.listBookmarks({
      query: q,
      limit: 15,
    });
    if (!items.length) {
      await ctx.reply("No results.");
      return;
    }
    const lines = items.map(
      (b) => `#${b.id} ${b.title ?? b.url}\n${b.abstract?.slice(0, 120) ?? ""}`,
    );
    await ctx.reply(lines.join("\n\n"));
  };
}
