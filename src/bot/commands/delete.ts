import type { Context } from "grammy";
import type { BotCommandDeps } from "./types.js";

function parseIntSafe(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function createDeleteCommand(deps: BotCommandDeps) {
  return async function handleDelete(ctx: Context) {
    const parts = (ctx.message?.text ?? "").trim().split(/\s+/);
    const id = parseIntSafe(parts[1]);
    if (id == null) {
      await ctx.reply("Usage: /delete <id>");
      return;
    }
    await deps.bookmarks.deleteBookmark(id);
    await ctx.reply(`Deleted #${id}`);
  };
}
