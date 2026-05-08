import type { Context } from "grammy";
import { TELEGRAM_MAX_MESSAGE_CHARS } from "../../constants.js";
import { extractUrlsFromText } from "../../services/url.js";
import type { BotCommandDeps } from "../commands/types.js";

export async function handlePrivateText(ctx: Context, deps: BotCommandDeps) {
  const msg = ctx.message ?? ctx.editedMessage;
  const text = [msg?.text, msg?.caption].filter(Boolean).join("\n").trim();
  if (!text) return;

  if (/^\d+$/.test(text)) {
    const id = Number.parseInt(text, 10);
    const bm = await deps.bookmarks.getById(id);
    if (!bm) {
      await ctx.reply(`Bookmark #${id} not found.`);
      return;
    }
    const lines = [
      `#${bm.id} ${bm.title ?? "(untitled)"}`,
      `URL: ${bm.url}`,
      `Status: ${bm.status} · Kind: ${bm.kind}`,
      `EN: ${(bm.abstract ?? "").trim() || "—"}`,
      `ZH: ${(bm.abstractZh ?? "").trim() || "—"}`,
      `Tags: ${bm.tagNames.length ? bm.tagNames.join(", ") : "—"}`,
    ];
    await ctx.reply(lines.join("\n").slice(0, TELEGRAM_MAX_MESSAGE_CHARS));
    return;
  }

  const urls = extractUrlsFromText(text);
  if (!urls.length) {
    await ctx.reply("No URL found. Paste a link starting with http(s)://");
    return;
  }

  const isForwardedFromChannel = msg?.forward_origin?.type === "channel";
  const forwardedChannelId =
    msg?.forward_origin?.type === "channel"
      ? String(msg.forward_origin.chat.id)
      : null;
  const source =
    isForwardedFromChannel &&
    forwardedChannelId != null &&
    forwardedChannelId === deps.channelId
      ? "channel"
      : "bot";
  const sourceChatId =
    source === "channel" ? forwardedChannelId : String(ctx.chat?.id);

  let queued = 0;
  let duplicates = 0;
  let requeued = 0;
  let lastId: number | null = null;
  for (const url of urls) {
    const result = await deps.pipeline.ingestUrl({
      url,
      source,
      sourceChatId,
      sourceMessageId: String(msg?.message_id),
    });
    lastId = result.id;
    if (!result.duplicate) queued += 1;
    if (result.duplicate && !result.requeued) duplicates += 1;
    if (result.duplicate && result.requeued) requeued += 1;
  }

  if (source === "channel") {
    await ctx.reply(
      `Migration batch done. ${queued} queued, ${requeued} reprocessing, ${duplicates} already indexed.`,
    );
    return;
  }

  if (urls.length === 1) {
    if (duplicates === 1) {
      await ctx.reply(`Already saved as #${lastId} (no changes).`);
    } else if (requeued === 1) {
      await ctx.reply(`Bookmark #${lastId} is being processed again.`);
    } else {
      await ctx.reply(
        `Queued bookmark #${lastId}. I will message you when it is ready.`,
      );
    }
    return;
  }

  await ctx.reply(
    `Processed ${urls.length} URLs. ${queued} queued, ${requeued} reprocessing, ${duplicates} already indexed.`,
  );
}
