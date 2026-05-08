import type { Bot } from "grammy";
import telegramifyMarkdown from "telegramify-markdown";
import { TELEGRAM_MAX_MESSAGE_CHARS } from "../constants.js";
import { logger } from "../logger.js";

export async function sendTelegramWithMarkdownFallback(
  botApi: Bot["api"],
  chatId: string,
  message: string,
  plainTextMessage: string,
) {
  try {
    const escaped = telegramifyMarkdown(message, "escape");
    for (let i = 0; i < escaped.length; i += TELEGRAM_MAX_MESSAGE_CHARS) {
      await botApi.sendMessage(
        chatId,
        escaped.slice(i, i + TELEGRAM_MAX_MESSAGE_CHARS),
        {
          parse_mode: "MarkdownV2",
          link_preview_options: { is_disabled: true },
        },
      );
    }
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isParseError =
      msg.includes("can't parse entities") || msg.includes("parse entities");
    if (!isParseError) throw err;
    logger.warn(
      { chatId, err },
      "markdown send failed, retrying as plain text",
    );
  }

  await botApi.sendMessage(
    chatId,
    plainTextMessage.slice(0, TELEGRAM_MAX_MESSAGE_CHARS),
    {
      link_preview_options: { is_disabled: true },
    },
  );
}
