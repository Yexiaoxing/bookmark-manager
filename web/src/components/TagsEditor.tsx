import type { FormEvent } from "react";

export function TagsEditor(props: {
  isEditing: boolean;
  tags: string[];
  tagInput: string;
  onTagInputChange: (v: string) => void;
  onAddTag: (e: FormEvent) => void;
  onRemoveTag: (t: string) => void;
  busy: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {props.tags.map((t) => (
          <span key={t} className="rounded-full bg-zinc-800 px-3 py-1 text-sm">
            {t}
            {props.isEditing ? (
              <button
                type="button"
                onClick={() => void props.onRemoveTag(t)}
                className="ml-2 text-zinc-300 hover:text-zinc-100"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {props.isEditing ? (
        <form onSubmit={props.onAddTag} className="flex gap-2">
          <input
            value={props.tagInput}
            onChange={(e) => props.onTagInputChange(e.target.value)}
            placeholder="new-tag"
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
          <button
            type="submit"
            disabled={props.busy}
            className="rounded border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800"
          >
            Add
          </button>
        </form>
      ) : null}
    </section>
  );
}
