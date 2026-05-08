import type { BookmarksService } from "../../services/bookmarks.js";
import type { Pipeline } from "../../services/pipeline.js";
import type { Relay } from "../relay.js";

export type BotCommandDeps = {
  bookmarks: BookmarksService;
  pipeline: Pipeline;
  channelId: string;
  relay: Relay;
};
