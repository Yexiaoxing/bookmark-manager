import type { Context, NextFunction } from "grammy";

export function createAuthMiddleware(allowed: Set<string>) {
  return async (ctx: Context, next: NextFunction) => {
    if (ctx.chat?.type !== "private") {
      return next();
    }
    const uid = String(ctx.from?.id ?? "");
    if (allowed.size > 0 && !allowed.has(uid)) {
      await ctx.reply("Unauthorized.");
      return;
    }
    return next();
  };
}
