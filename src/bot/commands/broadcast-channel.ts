import type { Context } from "grammy";
import type { BotCommandDeps } from "./types.js";

export function createBroadcastChannelCommand(deps: BotCommandDeps) {
  return async function handleBroadcastChannel(ctx: Context) {
    const userId = String(ctx.from?.id ?? "");
    if (!deps.relay.canBroadcast(userId)) {
      await ctx.reply("Unauthorized for channel broadcast.");
      return;
    }
    const parts = (ctx.message?.text ?? "").trim().split(/\s+/);
    const relayText = parts.slice(1).join(" ").trim();
    if (!relayText) {
      await ctx.reply("Usage: /broadcast_channel <text>");
      return;
    }
    const result = await deps.relay.broadcastChannel(relayText);
    if (!result.ok) {
      await ctx.reply(`Channel broadcast failed: ${result.error ?? "unknown"}`);
    } else {
      await ctx.reply("Channel broadcast sent.");
    }
  };
}
