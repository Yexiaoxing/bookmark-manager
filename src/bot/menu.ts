import type { Bot } from "grammy";

export async function broadcastTelegramCommands(bot: Bot) {
  await bot.api.setMyCommands([
    { command: "help", description: "Show help and command list" },
    { command: "recent", description: "List recent bookmark IDs" },
    { command: "search", description: "Search saved bookmarks" },
    { command: "tag", description: "Add tags to a bookmark" },
    { command: "untag", description: "Remove tags from a bookmark" },
    { command: "delete", description: "Delete a bookmark by ID" },
    { command: "migrate", description: "Show migration instructions" },
    {
      command: "broadcast",
      description: "Relay a message to allowed bot users",
    },
    {
      command: "broadcast_channel",
      description: "Relay a message to configured channel",
    },
  ]);
}
