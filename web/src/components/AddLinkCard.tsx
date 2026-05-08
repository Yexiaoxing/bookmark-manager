import { useState } from "react";
import { addBookmark } from "../api";

export function AddLinkCard({
  onAdded,
}: {
  onAdded: () => Promise<void> | void;
}) {
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onAddLink() {
    const url = newUrl.trim();
    if (!url) {
      setErr("Please enter a URL.");
      return;
    }
    setAdding(true);
    setErr(null);
    setNotice(null);
    try {
      const res = await addBookmark(url);
      setNewUrl("");
      setNotice(
        res.duplicate
          ? `Already exists as #${res.id}`
          : `Added bookmark #${res.id}`,
      );
      await onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="mb-2 text-sm text-zinc-400">Add new link</p>
      {err && (
        <div className="mb-2 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}
      {notice && (
        <div className="mb-2 rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {notice}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void onAddLink();
            }
          }}
          placeholder="https://example.com/article"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
        />
        <button
          type="button"
          disabled={adding}
          onClick={() => void onAddLink()}
          className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
