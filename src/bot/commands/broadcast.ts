import type { Context } from "grammy";
import type { BotCommandDeps } from "./types.js";

export function createBroadcastCommand(deps: BotCommandDeps) {
  return async function handleBroadcast(ctx: Context) {
    const userId = String(ctx.from?.id ?? "");
    if (!deps.relay.canBroadcast(userId)) {
      await ctx.reply("Unauthorized for broadcast.");
      return;
    }
    const parts = (ctx.message?.text ?? "").trim().split(/\s+/);
    const text = parts.slice(1).join(" ").trim();
    if (!text) {
      await ctx.reply("Usage: /broadcast <text>");
      return;
    }
    const result = await deps.relay.broadcastUsers(text, {
      excludeUserId: userId,
    });
    await ctx.reply(
      `Broadcast complete. attempted=${result.attempted}, sent=${result.sent}, failed=${result.failed}`,
    );
  };
}
