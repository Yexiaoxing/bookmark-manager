import type { BookmarkKind, BookmarkStatus } from "../api";

export type ListFilters = {
  query: string;
  tag: string;
  kind: BookmarkKind | "";
  status: BookmarkStatus | "";
};

export function parseListFilters(searchParams: URLSearchParams): ListFilters {
  const kindParam = searchParams.get("kind");
  const statusParam = searchParams.get("status");
  return {
    query: searchParams.get("query") ?? "",
    tag: searchParams.get("tag") ?? "",
    kind:
      kindParam === "article" ||
      kindParam === "youtube" ||
      kindParam === "other"
        ? kindParam
        : "",
    status:
      statusParam === "processing" ||
      statusParam === "pending" ||
      statusParam === "done" ||
      statusParam === "error" ||
      statusParam === "deleted"
        ? statusParam
        : "",
  };
}

export function setFilterOnSearchParams(
  searchParams: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (value.trim()) {
    next.set(key, value.trim());
  } else {
    next.delete(key);
  }
  return next;
}

export function serializeListFilters(filters: ListFilters): string {
  const sp = new URLSearchParams();
  if (filters.query.trim()) sp.set("query", filters.query.trim());
  if (filters.tag.trim()) sp.set("tag", filters.tag.trim());
  if (filters.kind) sp.set("kind", filters.kind);
  if (filters.status) sp.set("status", filters.status);
  const q = sp.toString();
  return q ? `?${q}` : "";
}
