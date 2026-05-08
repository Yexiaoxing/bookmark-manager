import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { BookmarkKind, BookmarkStatus } from "../api";
import { parseListFilters, setFilterOnSearchParams } from "../lib/filters";

export function useBookmarkFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseListFilters(searchParams), [searchParams]);

  const setFilter = (key: string, value: string) => {
    setSearchParams(setFilterOnSearchParams(searchParams, key, value));
  };

  return {
    filters,
    setQuery: (value: string) => setFilter("query", value),
    setTag: (value: string) => setFilter("tag", value),
    setKind: (value: BookmarkKind | "") => setFilter("kind", value),
    setStatus: (value: BookmarkStatus | "") => setFilter("status", value),
  };
}
