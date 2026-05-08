import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BookmarkDto,
  type BookmarkKind,
  type BookmarkStatus,
  listBookmarks,
} from "../api";

export function useBookmarkList(filters: {
  query: string;
  tag: string;
  kind: BookmarkKind | "";
  status: BookmarkStatus | "";
}) {
  const [items, setItems] = useState<BookmarkDto[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor: number | undefined, append: boolean) => {
      const requestId = ++latestRequestIdRef.current;
      setLoading(true);
      setErr(null);
      try {
        const res = await listBookmarks({
          query: filters.query.trim() || undefined,
          tag: filters.tag.trim() || undefined,
          kind: filters.kind || undefined,
          status: filters.status || undefined,
          cursor,
          limit: 20,
        });
        if (requestId !== latestRequestIdRef.current) return;
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setNextCursor(res.nextCursor);
      } catch (e) {
        if (requestId !== latestRequestIdRef.current) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [filters.query, filters.tag, filters.kind, filters.status],
  );

  useEffect(() => {
    void fetchPage(undefined, false);
  }, [fetchPage]);

  return { items, nextCursor, loading, err, fetchPage };
}
