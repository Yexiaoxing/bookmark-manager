import { Bot } from "grammy";
import type { Config } from "../config.js";
import { parseAllowedUserIds } from "../config.js";
import type { BookmarksService } from "../services/bookmarks.js";
import type { Pipeline } from "../services/pipeline.js";
import { registerPrivateCommands } from "./commands/index.js";
import { handleChannelPost } from "./handlers/channel-post.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createRelay } from "./relay.js";

export { broadcastTelegramCommands } from "./menu.js";

export function createTelegramBot(deps: {
  config: Config;
  bookmarks: BookmarksService;
  pipeline: Pipeline;
}) {
  const bot = new Bot(deps.config.TELEGRAM_BOT_TOKEN);
  const allowed = parseAllowedUserIds(deps.config.TELEGRAM_ALLOWED_USER_IDS);
  const channelId = deps.config.TELEGRAM_CHANNEL_ID.trim();
  const relay = createRelay(bot, { allowed, channelId });

  bot.use(createAuthMiddleware(allowed));

  registerPrivateCommands(bot, {
    bookmarks: deps.bookmarks,
    pipeline: deps.pipeline,
    channelId,
    relay,
  });

  const channelHandler = async (
    ctx: Parameters<typeof handleChannelPost>[0],
  ) => {
    await handleChannelPost(ctx, { pipeline: deps.pipeline, channelId });
  };

  bot.on("channel_post", channelHandler);
  bot.on("edited_channel_post", channelHandler);

  return bot;
}
