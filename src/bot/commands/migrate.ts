import type { Context } from "grammy";

export async function handleMigrate(ctx: Context) {
  await ctx.reply(
    [
      "Bot API limitation: bots cannot directly fetch years of old channel history.",
      "Migration mode uses forwarded posts or pasted export text.",
      "",
      "How to migrate old URLs:",
      "1) Open the target channel history.",
      "2) Select old messages and forward them to this bot (can be in batches).",
      "3) Each forwarded message is scanned for URLs and ingested with dedupe.",
      "",
      "Tip: you can also paste text from Telegram export JSON chunks; URL extraction works the same.",
    ].join("\n"),
  );
}
