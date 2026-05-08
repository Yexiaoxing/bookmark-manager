import { Link } from "react-router-dom";
import type { BookmarkDto } from "../api";
import { hostFromUrl } from "../lib/url";
import { BookmarkStatusBadge } from "./BookmarkStatusBadge";

export function BookmarkListItem({
  bookmark: b,
  listQueryString,
}: {
  bookmark: BookmarkDto;
  listQueryString: string;
}) {
  return (
    <li>
      <Link
        to={`/b/${b.id}${listQueryString}`}
        className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600"
      >
        <div className="flex items-start gap-3">
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostFromUrl(b.url))}&sz=32`}
            alt=""
            className="mt-0.5 h-5 w-5 opacity-80"
            width={20}
            height={20}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-100">
                {b.title ?? b.url}
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                {b.kind}
              </span>
              <BookmarkStatusBadge status={b.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {b.abstractZh ?? b.abstract ?? "—"}
            </p>
            {b.error ? (
              <p className="mt-1 line-clamp-2 text-xs text-red-300">
                Error: {b.error}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1">
              {b.tagNames.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-2 truncate text-xs text-zinc-600">
              {hostFromUrl(b.url)} ·{" "}
              {new Date(b.updatedAt as unknown as string).toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}
