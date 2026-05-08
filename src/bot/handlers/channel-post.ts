import type { Context } from "grammy";
import type { Pipeline } from "../../services/pipeline.js";
import { extractUrlsFromText } from "../../services/url.js";

export async function handleChannelPost(
  ctx: Context,
  deps: { pipeline: Pipeline; channelId: string },
) {
  if (String(ctx.chat?.id) !== deps.channelId) return;
  const msg = ctx.channelPost ?? ctx.editedChannelPost;
  const text = [msg?.text, msg?.caption].filter(Boolean).join("\n");
  const urls = extractUrlsFromText(text);
  for (const url of urls) {
    await deps.pipeline.ingestUrl({
      url,
      source: "channel",
      sourceChatId: String(ctx.chat?.id),
      sourceMessageId: String(msg?.message_id),
    });
  }
}
