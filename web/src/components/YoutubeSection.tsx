import ReactMarkdown from "react-markdown";
import type { BookmarkDto } from "../api";

export function YoutubeSection({
  youtube,
}: {
  youtube: NonNullable<BookmarkDto["youtube"]>;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-lg font-medium">YouTube</h2>
      {youtube.channel && (
        <p className="text-sm text-zinc-400">{youtube.channel}</p>
      )}
      <details className="group">
        <summary className="cursor-pointer text-sm text-emerald-400">
          Transcript
        </summary>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-zinc-950 p-3 text-xs text-zinc-300">
          {youtube.transcript ?? "—"}
        </pre>
      </details>
      <details open className="group">
        <summary className="cursor-pointer text-sm text-emerald-400">
          Summary
        </summary>
        <div className="markdown-content mt-2 text-zinc-300">
          <ReactMarkdown>{youtube.summary ?? "—"}</ReactMarkdown>
        </div>
      </details>
    </section>
  );
}
