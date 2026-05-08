import type { Bot } from "grammy";
import telegramifyMarkdown from "telegramify-markdown";
import { TELEGRAM_MAX_MESSAGE_CHARS } from "../constants.js";
import { logger } from "../logger.js";
import { sendTelegramWithMarkdownFallback } from "./markdown.js";
import type { DoneBatchItem } from "./templates.js";
import {
  renderChannelEditMessage,
  renderDoneBatchMessage,
  renderFailureMessage,
} from "./templates.js";

export type TelegramNotifier = {
  setApi: (api: Bot["api"]) => void;
  queueDone: (
    item: DoneBatchItem,
    backlog: number,
    sourceChatId: string,
  ) => void;
  flushAll: () => Promise<void>;
  notifyFailure: (payload: {
    sourceChatId: string;
    id: number;
    url: string;
    error: string;
    backlog: number;
  }) => Promise<void>;
  editChannelMessage: (input: {
    chatId: string;
    messageId: number;
    id: number;
    url: string;
    title: string | null;
    abstract: string | null;
    abstractZh: string | null;
  }) => Promise<void>;
};

type DoneBatchState = {
  items: DoneBatchItem[];
  timer: NodeJS.Timeout | null;
  latestBacklog: number;
};

export function createTelegramNotifier(opts: {
  uiBaseUrl: string;
  doneBatchDelayMs: number;
  doneBatchMaxItems: number;
}): TelegramNotifier {
  let telegramApi: Bot["api"] | null = null;
  const doneBatches = new Map<string, DoneBatchState>();

  function setApi(api: Bot["api"]) {
    telegramApi = api;
  }

  async function flushDoneBatch(chatId: string) {
    const state = doneBatches.get(chatId);
    if (!state || !telegramApi || state.items.length === 0) return;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    const items = state.items.splice(0, state.items.length);
    const { markdown, plainText } = renderDoneBatchMessage(
      opts.uiBaseUrl,
      items,
      state.latestBacklog,
    );
    logger.debug({ chatId, message: markdown }, "sending done batch");
    try {
      await sendTelegramWithMarkdownFallback(
        telegramApi,
        chatId,
        markdown,
        plainText,
      );
    } catch (err) {
      logger.error({ err, chatId }, "failed to send done batch");
    }
    if (state.items.length === 0) {
      doneBatches.delete(chatId);
    }
  }

  async function editChannelMessage(input: {
    chatId: string;
    messageId: number;
    id: number;
    url: string;
    title: string | null;
    abstract: string | null;
    abstractZh: string | null;
  }) {
    if (!telegramApi) return;
    const { markdown, plainText } = renderChannelEditMessage(opts.uiBaseUrl, {
      id: input.id,
      url: input.url,
      title: input.title,
      abstract: input.abstract,
      abstractZh: input.abstractZh,
    });
    try {
      const escaped = telegramifyMarkdown(markdown, "escape");
      await telegramApi.editMessageText(
        input.chatId,
        input.messageId,
        escaped.slice(0, TELEGRAM_MAX_MESSAGE_CHARS),
        { parse_mode: "MarkdownV2" },
      );
      return;
    } catch (err) {
      logger.debug(
        { err, chatId: input.chatId, messageId: input.messageId },
        "editMessageText failed, retrying as caption",
      );
    }
    await telegramApi.editMessageCaption(input.chatId, input.messageId, {
      caption: plainText,
    });
  }

  function queueDone(
    item: DoneBatchItem,
    backlog: number,
    sourceChatId: string,
  ) {
    let state = doneBatches.get(sourceChatId);
    if (!state) {
      state = { items: [], timer: null, latestBacklog: backlog };
      doneBatches.set(sourceChatId, state);
    }
    state.items.push(item);
    state.latestBacklog = backlog;
    if (!state.timer) {
      state.timer = setTimeout(() => {
        void flushDoneBatch(sourceChatId);
      }, opts.doneBatchDelayMs);
    }
    if (state.items.length >= opts.doneBatchMaxItems) {
      void flushDoneBatch(sourceChatId);
    }
  }

  async function flushAll() {
    for (const chatId of doneBatches.keys()) {
      await flushDoneBatch(chatId);
    }
  }

  async function notifyFailure(payload: {
    sourceChatId: string;
    id: number;
    url: string;
    error: string;
    backlog: number;
  }) {
    if (!telegramApi) return;
    const { markdown, plainText } = renderFailureMessage(opts.uiBaseUrl, {
      id: payload.id,
      url: payload.url,
      error: payload.error,
      backlog: payload.backlog,
    });
    try {
      await sendTelegramWithMarkdownFallback(
        telegramApi,
        payload.sourceChatId,
        markdown,
        plainText,
      );
    } catch {
      /* ignore notify errors */
    }
  }

  return {
    setApi,
    queueDone,
    flushAll,
    notifyFailure,
    editChannelMessage,
  };
}
