import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTags } from "../api";

export default function Tags() {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void listTags()
      .then(setTags)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) {
    return <p className="text-red-300">{err}</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Tags</h1>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.name}
            to={`/?tag=${encodeURIComponent(t.name)}`}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:border-emerald-700"
          >
            {t.name} <span className="text-zinc-500">({t.count})</span>
          </Link>
        ))}
      </div>
      {!tags.length && (
        <p className="text-zinc-500">No tags yet. Save some bookmarks first.</p>
      )}
    </div>
  );
}
