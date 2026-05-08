import type { RefObject } from "react";
import type { BookmarkKind, BookmarkStatus } from "../api";

export function FilterBar(props: {
  searchRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
  tag: string;
  onTagChange: (value: string) => void;
  kind: BookmarkKind | "";
  onKindChange: (value: BookmarkKind | "") => void;
  status: BookmarkStatus | "";
  onStatusChange: (value: BookmarkStatus | "") => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm">
        <span className="text-zinc-500">Search (press /)</span>
        <input
          ref={props.searchRef}
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value)}
          placeholder="Full-text search…"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="w-full text-sm sm:w-40">
        <span className="text-zinc-500">Tag</span>
        <input
          value={props.tag}
          onChange={(e) => props.onTagChange(e.target.value)}
          placeholder="filter"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="w-full text-sm sm:w-36">
        <span className="text-zinc-500">Kind</span>
        <select
          value={props.kind}
          onChange={(e) =>
            props.onKindChange(e.target.value as BookmarkKind | "")
          }
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-600"
        >
          <option value="">all</option>
          <option value="article">article</option>
          <option value="youtube">youtube</option>
          <option value="other">other</option>
        </select>
      </label>
      <label className="w-full text-sm sm:w-40">
        <span className="text-zinc-500">Status</span>
        <select
          value={props.status}
          onChange={(e) =>
            props.onStatusChange(e.target.value as BookmarkStatus | "")
          }
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-600"
        >
          <option value="">all</option>
          <option value="processing">processing</option>
          <option value="pending">pending</option>
          <option value="done">done</option>
          <option value="error">error</option>
          <option value="deleted">deleted</option>
        </select>
      </label>
    </div>
  );
}
