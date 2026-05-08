import type { Bot } from "grammy";
import { Composer } from "grammy";
import { handlePrivateText } from "../handlers/private-text.js";
import { createBroadcastCommand } from "./broadcast.js";
import { createBroadcastChannelCommand } from "./broadcast-channel.js";
import { createDeleteCommand } from "./delete.js";
import { handleHelp } from "./help.js";
import { handleMigrate } from "./migrate.js";
import { createRecentCommand } from "./recent.js";
import { createSearchCommand } from "./search.js";
import { createTagCommand } from "./tag.js";
import type { BotCommandDeps } from "./types.js";
import { createUntagCommand } from "./untag.js";

export function registerPrivateCommands(bot: Bot, deps: BotCommandDeps) {
  const c = new Composer();
  c.command("start", handleHelp);
  c.command("help", handleHelp);
  c.command("broadcast", createBroadcastCommand(deps));
  c.command("broadcast_channel", createBroadcastChannelCommand(deps));
  c.command("migrate", handleMigrate);
  c.command("recent", createRecentCommand(deps));
  c.command("search", createSearchCommand(deps));
  c.command("tag", createTagCommand(deps));
  c.command("untag", createUntagCommand(deps));
  c.command("delete", createDeleteCommand(deps));

  c.on(["message:text", "edited_message:text"], async (ctx) => {
    const msg = ctx.message ?? ctx.editedMessage;
    const text = [msg?.text, msg?.caption].filter(Boolean).join("\n").trim();
    if (text.startsWith("/")) {
      await ctx.reply("Unknown command. Try /help");
      return;
    }
    await handlePrivateText(ctx, deps);
  });

  bot.chatType("private").use(c);
}
