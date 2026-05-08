import { broadcastTelegramCommands, createTelegramBot } from "./bot/index.js";
import { loadConfig } from "./config.js";
import { createDb } from "./db/index.js";
import { runMigrations } from "./db/migrate.js";
import { logger } from "./logger.js";
import { buildServer } from "./server/index.js";
import { createBookmarksService } from "./services/bookmarks.js";
import { createLlmClient } from "./services/llm.js";
import { createPipeline } from "./services/pipeline.js";
import { createTelegramNotifier } from "./telegram/notifier.js";

export async function bootstrap() {
  const config = loadConfig();
  const db = createDb(config.DATABASE_URL);
  runMigrations(db);
  const bookmarks = createBookmarksService(db);
  const llm = createLlmClient(config);

  const uiBaseUrl =
    config.PUBLIC_UI_BASE_URL ||
    `http://${config.HTTP_HOST}:${config.HTTP_PORT}`;

  const notifier = createTelegramNotifier({
    uiBaseUrl,
    doneBatchDelayMs: config.DONE_BATCH_DELAY_MS,
    doneBatchMaxItems: config.DONE_BATCH_MAX_ITEMS,
  });

  const pipeline = createPipeline({
    bookmarks,
    llm,
    queueConcurrency: config.QUEUE_CONCURRENCY,
    retryMaxAttemptsExclusive: config.RETRY_MAX_ATTEMPTS,
  });

  pipeline.onDone(async (p) => {
    const backlog = p.backlogCount ?? 0;
    if (!p.sourceChatId) return;

    if (!p.error && p.source === "channel") {
      const messageId = Number.parseInt(p.sourceMessageId ?? "", 10);
      if (Number.isFinite(messageId)) {
        try {
          await notifier.editChannelMessage({
            chatId: p.sourceChatId,
            messageId,
            id: p.id,
            url: p.url,
            title: p.title,
            abstract: p.abstract,
            abstractZh: p.abstractZh,
          });
        } catch (err) {
          logger.warn(
            { err, chatId: p.sourceChatId, sourceMessageId: p.sourceMessageId },
            "failed to update original channel message",
          );
        }
      }
      return;
    }
    if (!p.error && p.source !== "bot") return;
    if (!p.error) {
      notifier.queueDone(
        {
          id: p.id,
          url: p.url,
          title: p.title,
          abstract: p.abstract,
          abstractZh: p.abstractZh,
        },
        backlog,
        p.sourceChatId,
      );
      return;
    }
    await notifier.notifyFailure({
      sourceChatId: p.sourceChatId,
      id: p.id,
      url: p.url,
      error: p.error ?? "unknown",
      backlog,
    });
  });

  const recovered = await pipeline.recoverPending();
  if (recovered > 0) {
    logger.info(
      { recovered },
      "startup re-enqueued pending/processing bookmarks",
    );
  }

  const bot = createTelegramBot({ config, bookmarks, pipeline });
  notifier.setApi(bot.api);

  try {
    await broadcastTelegramCommands(bot);
    logger.info("broadcasted bot commands to Telegram clients");
  } catch (err) {
    logger.warn({ err }, "failed to broadcast bot commands");
  }
  bot.catch((err) => {
    logger.error({ err }, "telegram bot error");
  });

  const app = await buildServer({ bookmarks, pipeline });
  await app.listen({ host: config.HTTP_HOST, port: config.HTTP_PORT });

  void bot
    .start({
      onStart: (botInfo) => {
        app.log.info(`Telegram bot @${botInfo.username} started`);
      },
    })
    .catch((e) => {
      app.log.error(e);
    });

  const shutdown = async () => {
    await notifier.flushAll();
    await bot.stop();
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
