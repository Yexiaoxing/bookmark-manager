import type { FastifyInstance } from "fastify";
import type { BookmarksService } from "../services/bookmarks.js";
import type { Pipeline } from "../services/pipeline.js";
import {
  parseOptionalBookmarkKind,
  parseOptionalBookmarkStatus,
} from "./validators.js";

export function registerApiRoutes(
  app: FastifyInstance,
  deps: { bookmarks: BookmarksService; pipeline: Pipeline },
) {
  app.get("/api/bookmarks", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    const cursor = q.cursor ? Number(q.cursor) : undefined;
    const limit = q.limit ? Number(q.limit) : 20;
    const res = await deps.bookmarks.listBookmarks({
      query: q.query,
      tag: q.tag,
      kind: parseOptionalBookmarkKind(q.kind),
      status: parseOptionalBookmarkStatus(q.status),
      cursor: Number.isFinite(cursor) ? cursor : undefined,
      limit: Number.isFinite(limit) ? limit : 20,
    });
    return res;
  });

  app.get<{ Params: { id: string } }>(
    "/api/bookmarks/:id",
    async (req, reply) => {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        return reply.status(400).send({ error: "invalid id" });
      }
      const row = await deps.bookmarks.getById(id);
      if (!row) return reply.status(404).send({ error: "not found" });
      return row;
    },
  );

  app.post<{ Body: { url?: string } }>("/api/bookmarks", async (req, reply) => {
    const url = req.body?.url?.trim();
    if (!url) return reply.status(400).send({ error: "url required" });
    const r = await deps.pipeline.ingestUrl({
      url,
      source: "manual",
      sourceChatId: null,
      sourceMessageId: null,
    });
    return reply.status(201).send(r);
  });

  app.patch<{
    Params: { id: string };
    Body: {
      title?: string;
      abstract?: string;
      abstractZh?: string;
      tagNames?: string[];
    };
  }>("/api/bookmarks/:id", async (req, reply) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    const body = req.body ?? {};
    await deps.bookmarks.patchBookmark(id, {
      title: body.title,
      abstract: body.abstract,
      abstractZh: body.abstractZh,
      tagNames: body.tagNames,
    });
    const row = await deps.bookmarks.getById(id);
    return row;
  });

  app.delete<{ Params: { id: string } }>(
    "/api/bookmarks/:id",
    async (req, reply) => {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        return reply.status(400).send({ error: "invalid id" });
      }
      await deps.bookmarks.deleteBookmark(id);
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/bookmarks/:id/reprocess",
    async (req, reply) => {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        return reply.status(400).send({ error: "invalid id" });
      }
      const row = await deps.bookmarks.getById(id);
      if (!row) return reply.status(404).send({ error: "not found" });
      await deps.bookmarks.markStatus(id, "pending", null);
      deps.pipeline.enqueue(id, { priority: "high" });
      return { ok: true, id };
    },
  );

  app.get("/api/tags", async () => {
    return deps.bookmarks.listAllTags();
  });
}
