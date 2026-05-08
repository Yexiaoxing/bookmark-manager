import fs from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import { loggerOptions } from "../logger.js";
import type { BookmarksService } from "../services/bookmarks.js";
import type { Pipeline } from "../services/pipeline.js";
import { registerApiRoutes } from "./routes.js";

export async function buildServer(deps: {
  bookmarks: BookmarksService;
  pipeline: Pipeline;
}) {
  const app = fastify({ logger: loggerOptions });

  registerApiRoutes(app, deps);

  const webDist = path.join(process.cwd(), "web", "dist");
  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url?.startsWith("/api")) {
        return reply.status(404).send({ error: "not found" });
      }
      return reply.sendFile("index.html");
    });
  } else {
    app.log.warn(
      { webDist },
      "web/dist not found; static web UI is disabled (run `pnpm build`)",
    );
  }

  return app;
}
