const base = "";

export type BookmarkKind = "article" | "youtube" | "other";
export type BookmarkStatus =
  | "pending"
  | "processing"
  | "done"
  | "error"
  | "deleted";

export type BookmarkDto = {
  id: number;
  url: string;
  normalizedUrl: string;
  title: string | null;
  abstract: string | null;
  abstractZh: string | null;
  kind: BookmarkKind;
  source: string;
  status: BookmarkStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  tagNames: string[];
  youtube: {
    videoId: string;
    channel: string | null;
    transcript: string | null;
    summary: string | null;
  } | null;
};

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body != null;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listBookmarks(params: {
  query?: string;
  tag?: string;
  kind?: BookmarkKind;
  status?: BookmarkStatus;
  cursor?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params.query) sp.set("query", params.query);
  if (params.tag) sp.set("tag", params.tag);
  if (params.kind) sp.set("kind", params.kind);
  if (params.status) sp.set("status", params.status);
  if (params.cursor != null) sp.set("cursor", String(params.cursor));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return json<{ items: BookmarkDto[]; nextCursor: number | null }>(
    `/api/bookmarks${q ? `?${q}` : ""}`,
  );
}

export function getBookmark(id: number) {
  return json<BookmarkDto>(`/api/bookmarks/${id}`);
}

export function patchBookmark(
  id: number,
  body: {
    title?: string;
    abstract?: string;
    abstractZh?: string;
    tagNames?: string[];
  },
) {
  return json<BookmarkDto>(`/api/bookmarks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteBookmark(id: number) {
  return json<void>(`/api/bookmarks/${id}`, { method: "DELETE" });
}

export function addBookmark(url: string) {
  return json<{ id: number; duplicate: boolean; requeued: boolean }>(
    "/api/bookmarks",
    { method: "POST", body: JSON.stringify({ url }) },
  );
}

export function reprocessBookmark(id: number) {
  return json<{ ok: boolean; id: number }>(`/api/bookmarks/${id}/reprocess`, {
    method: "POST",
  });
}

export function listTags() {
  return json<{ name: string; count: number }[]>("/api/tags");
}
