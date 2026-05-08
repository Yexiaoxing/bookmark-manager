import type { Bot } from "grammy";
import { TELEGRAM_MAX_MESSAGE_CHARS } from "../constants.js";

export function createRelay(
  bot: Bot,
  opts: { allowed: Set<string>; channelId: string },
) {
  function canBroadcast(userId: string): boolean {
    if (opts.allowed.size === 0) return false;
    return opts.allowed.has(userId);
  }

  async function broadcastUsers(
    text: string,
    relayOpts?: { excludeUserId?: string },
  ): Promise<{ attempted: number; sent: number; failed: number }> {
    const targets = [...opts.allowed].filter(
      (id) => id !== relayOpts?.excludeUserId,
    );
    let sent = 0;
    let failed = 0;
    for (const userId of targets) {
      try {
        await bot.api.sendMessage(
          userId,
          text.slice(0, TELEGRAM_MAX_MESSAGE_CHARS),
          {
            link_preview_options: { is_disabled: true },
          },
        );
        sent += 1;
      } catch {
        failed += 1;
      }
    }
    return { attempted: targets.length, sent, failed };
  }

  async function broadcastChannel(
    text: string,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await bot.api.sendMessage(
        opts.channelId,
        text.slice(0, TELEGRAM_MAX_MESSAGE_CHARS),
        {
          link_preview_options: { is_disabled: true },
        },
      );
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  }

  return { canBroadcast, broadcastUsers, broadcastChannel };
}

export type Relay = ReturnType<typeof createRelay>;
