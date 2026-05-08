import { AddLinkCard } from "../components/AddLinkCard";
import { BookmarkListItem } from "../components/BookmarkListItem";
import { FilterBar } from "../components/FilterBar";
import { useBookmarkFilters } from "../hooks/useBookmarkFilters";
import { useBookmarkList } from "../hooks/useBookmarkList";
import { useFocusOnSlash } from "../hooks/useFocusOnSlash";
import { serializeListFilters } from "../lib/filters";

export default function Home() {
  const { filters, setQuery, setTag, setKind, setStatus } =
    useBookmarkFilters();
  const { items, nextCursor, loading, err, fetchPage } =
    useBookmarkList(filters);
  const searchRef = useFocusOnSlash();
  const listQueryString = serializeListFilters(filters);

  return (
    <div className="space-y-6">
      <AddLinkCard onAdded={() => fetchPage(undefined, false)} />

      <FilterBar
        searchRef={searchRef}
        query={filters.query}
        onQueryChange={setQuery}
        tag={filters.tag}
        onTagChange={setTag}
        kind={filters.kind}
        onKindChange={setKind}
        status={filters.status}
        onStatusChange={setStatus}
      />

      {err && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-red-200">
          {err}
        </div>
      )}

      <ul className="space-y-3">
        {items.map((b) => (
          <BookmarkListItem
            key={b.id}
            bookmark={b}
            listQueryString={listQueryString}
          />
        ))}
      </ul>

      {loading && <p className="text-zinc-500">Loading…</p>}

      {!loading && nextCursor != null && (
        <button
          type="button"
          onClick={() => void fetchPage(nextCursor, true)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Load more
        </button>
      )}
    </div>
  );
}
