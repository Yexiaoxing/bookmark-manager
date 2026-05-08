import type { Context } from "grammy";

export async function handleHelp(ctx: Context) {
  await ctx.reply(
    [
      "Send a URL to save it.",
      "Commands:",
      "/recent [N] — last bookmarks with EN/ZH abstracts (rich entries)",
      "/search <query> — search saved bookmarks",
      "/tag <id> <tags...> — add tags to a bookmark (merged with existing)",
      "/untag <id> <tags...> — remove tags",
      "/delete <id> — delete bookmark",
      "/migrate — migrate historical channel content via forwarded posts",
      "/broadcast <text> — relay message to allowed bot users",
      "/broadcast_channel <text> — post relay message to configured channel",
    ].join("\n"),
  );
}
