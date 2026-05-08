import { Link, useNavigate, useParams } from "react-router-dom";
import { AbstractSection } from "../components/AbstractSection";
import { TagsEditor } from "../components/TagsEditor";
import { YoutubeSection } from "../components/YoutubeSection";
import { useBookmarkEditor } from "../hooks/useBookmarkEditor";
import { useBackToList } from "../lib/back-link";

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const backTo = useBackToList();
  const bookmarkId =
    id != null && Number.isFinite(Number(id)) ? Number(id) : undefined;

  const editor = useBookmarkEditor(bookmarkId);

  async function onDelete() {
    if (!editor.b || !confirm("Delete this bookmark?")) return;
    const ok = await editor.deleteById();
    if (ok) nav(backTo);
  }

  return (
    <div className="space-y-6">
      <Link to={backTo} className="text-sm text-emerald-400 hover:underline">
        ← Back
      </Link>

      {!editor.b && !editor.err ? (
        <p className="text-zinc-500">Loading…</p>
      ) : editor.err && !editor.b ? (
        <div className="text-red-300">
          {editor.err}{" "}
          <Link to={backTo} className="text-emerald-400 underline">
            Home
          </Link>
        </div>
      ) : editor.b ? (
        <>
          {editor.err && (
            <div className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-red-200">
              {editor.err}
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {editor.b.title ?? "Untitled"}
            </h1>
            <a
              href={editor.b.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-emerald-400 hover:underline"
            >
              {editor.b.url}
            </a>
            <p className="text-sm text-zinc-500">
              #{editor.b.id} · {editor.b.kind} · {editor.b.status}
            </p>
            {editor.b.error ? (
              <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                Error reason: {editor.b.error}
              </p>
            ) : null}
            <div className="flex gap-2 pt-2">
              {!editor.isEditing ? (
                <button
                  type="button"
                  onClick={() => editor.setIsEditing(true)}
                  className="rounded border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={editor.busy}
                    onClick={() => void editor.saveMeta()}
                    className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={editor.busy}
                    onClick={editor.cancelEdit}
                    className="rounded border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <AbstractSection
            title="Abstract (English)"
            isEditing={editor.isEditing}
            value={editor.abstract}
            onChange={editor.setAbstract}
            readOnlyContent={editor.b.abstract}
          />

          <AbstractSection
            title="Abstract (Chinese)"
            isEditing={editor.isEditing}
            value={editor.abstractZh}
            onChange={editor.setAbstractZh}
            readOnlyContent={editor.b.abstractZh}
          />

          <section className="space-y-2">
            <h2 className="text-lg font-medium">Title</h2>
            {editor.isEditing ? (
              <input
                value={editor.title}
                onChange={(e) => editor.setTitle(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            ) : (
              <p className="text-zinc-300">{editor.b.title ?? "Untitled"}</p>
            )}
          </section>

          <TagsEditor
            isEditing={editor.isEditing}
            tags={editor.tags}
            tagInput={editor.tagInput}
            onTagInputChange={editor.setTagInput}
            onAddTag={editor.addTag}
            onRemoveTag={(t) => void editor.removeTag(t)}
            busy={editor.busy}
          />

          {editor.b.youtube && <YoutubeSection youtube={editor.b.youtube} />}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={editor.busy}
              onClick={() => void editor.reprocess()}
              className="rounded border border-amber-800 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/40"
            >
              Reprocess
            </button>
            <button
              type="button"
              disabled={editor.busy}
              onClick={() => void onDelete()}
              className="rounded border border-red-800 px-4 py-2 text-sm text-red-200 hover:bg-red-950/40"
            >
              Delete
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
