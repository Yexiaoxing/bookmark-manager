# Bookmarks manager

Local bookmark manager: watches a Telegram **channel** for URLs (Bot API), accepts URLs via a **Telegram bot** DM, enriches pages with an LLM provider (OpenAI or Cursor SDK), handles **YouTube** transcripts + summaries, stores everything in **SQLite**, and serves a **local web UI**.

For X/Twitter and Bluesky post URLs, extraction uses [FxEmbed APIs](https://docs.fxembed.com/api/introduction/) first, then falls back to regular page extraction.
For Hacker News item URLs (`news.ycombinator.com/item?id=...`), extraction uses the official [Hacker News API](https://github.com/HackerNews/API) first, then falls back to regular page extraction.

## Requirements

- Node.js **20+**
- `pnpm` (per project tooling; run `source ~/.zshrc` if your shell does not have `pnpm` on `PATH`)
- Optional: **`yt-dlp`** on `PATH` for YouTube transcripts when `youtubei.js` cannot fetch captions
- For browser fallback extraction, install Playwright Chromium once: `pnpm exec playwright install chromium`

## Setup

1. Clone / copy this repo and install:

   ```bash
   pnpm install
   ```

2. Copy [`.env.example`](.env.example) to `.env` and fill in:

   | Variable | Description |
   |----------|-------------|
   | `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
   | `TELEGRAM_CHANNEL_ID` | Numeric channel id (e.g. `-100…`). Bot must be **administrator** in that channel so it receives `channel_post` updates. |
   | `TELEGRAM_ALLOWED_USER_IDS` | Optional comma-separated Telegram user ids allowed to use the bot in private chat. Empty = allow everyone. |
   | `LLM_PROVIDER` | `openai` (default) or `cursor` |
   | `OPENAI_API_KEY` | Required when `LLM_PROVIDER=openai` |
   | `OPENAI_BASE_URL` | Default `https://api.openai.com/v1` (trailing slash stripped) |
   | `OPENAI_MODEL` / `OPENAI_MODEL_LONG` | OpenAI models, default `gpt-4o-mini` |
   | `CURSOR_API_KEY` | Required when `LLM_PROVIDER=cursor` |
   | `CURSOR_MODEL` / `CURSOR_MODEL_LONG` | Cursor model ids, default `composer-2` |
   | `DATABASE_URL` | SQLite file path, default `./data/bookmarks.db` |
   | `HTTP_HOST` / `HTTP_PORT` | Bind address for Fastify + static UI |
   | `PUBLIC_UI_BASE_URL` | Optional public URL used in Telegram UI links (e.g. `https://bookmarks.example.com`) |

3. Apply DB migrations (also run automatically on app startup):

   ```bash
   pnpm db:migrate
   ```

## Telegram channel monitoring (Bot API)

1. Create a bot with BotFather, get `TELEGRAM_BOT_TOKEN`.
2. Add the bot to your channel as **administrator** (it must be able to read messages / posts in that channel per Telegram rules).
3. Post links in the channel; the bot ingests every URL found in `text` or `caption` (including media captions).

Only posts in the channel whose id matches `TELEGRAM_CHANNEL_ID` are processed.

## LLM provider switch

Set `LLM_PROVIDER` in `.env`:

- `openai` → uses OpenAI-compatible Chat Completions endpoint (`OPENAI_*` env vars)
- `cursor` → uses `@cursor/sdk` local runtime with `Agent.prompt(...)` (`CURSOR_*` env vars)

For Cursor mode, generate an API key from Cursor dashboard and set `CURSOR_API_KEY`.

## Run

**Development** (API on `http://127.0.0.1:8787`, Vite on `http://127.0.0.1:5173` with `/api` proxied):

```bash
pnpm dev
```

Open `http://127.0.0.1:5173`.

**Production-style** (build frontend + bundle server, then run a single process):

```bash
pnpm build
pnpm start
```

`pnpm start` runs `dist/main.js`, which loads `.env` from the working directory via `dotenv`. The process serves `web/dist` and `/api/*` on `HTTP_HOST`:`HTTP_PORT`.

### Run with PM2

```bash
pnpm build
pnpm pm2:start
```

Useful commands:

- `pnpm pm2:logs`
- `pnpm pm2:restart`
- `pnpm pm2:stop`

## Telegram bot commands (private chat)

- Send a URL → queue bookmark, notify when done (if started from DM).
- `/recent [N]` — recent bookmark ids  
- `/search <query>` — text search  
- `/tag <id> <tags...>` / `/untag <id> <tags...>`  
- `/delete <id>`  
- `/migrate` — shows backfill instructions for historical channel posts  
- `/broadcast <text>` — relay a message to allowed bot users  
- `/broadcast_channel <text>` — relay a message to the configured channel  
- `/help`

### Historical channel migration

Because Telegram Bot API cannot directly fetch years of historical channel messages,
use the bot-assisted migration flow:

1. Send `/migrate` to the bot.
2. Forward historical channel messages (in batches) to the bot.
3. The bot extracts URLs from each forwarded message and ingests them with dedupe.

Only forwarded messages whose origin channel matches `TELEGRAM_CHANNEL_ID` are treated as channel-history migration.

## HTTP API (`/api`)

- `GET /api/bookmarks?query=&tag=&kind=&cursor=&limit=`
- `GET /api/bookmarks/:id`
- `POST /api/bookmarks` `{ "url": "https://..." }`
- `PATCH /api/bookmarks/:id` `{ "title", "abstract", "tagNames" }`
- `DELETE /api/bookmarks/:id`
- `POST /api/bookmarks/:id/reprocess`
- `GET /api/tags`

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | `tsx watch` API (port 8787) + Vite (5173) |
| `pnpm build` | `vite build` + `tsup` bundle |
| `pnpm start` | Run `dist/main.js` |
| `pnpm pm2:start` | Start app via PM2 (`ecosystem.config.cjs`) |
| `pnpm pm2:restart` | Restart PM2 app (`bookmarks-manager`) |
| `pnpm pm2:logs` | Tail PM2 logs |
| `pnpm pm2:stop` | Stop and delete PM2 app |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Drizzle Studio |

## Scope / limitations

- Web UI is **unauthenticated**; bind to `127.0.0.1` for local-only use.
- Search uses SQLite **FTS5** (no vectors).
- Channel ingestion does not DM anyone on completion (only bot-originated saves notify the user).
