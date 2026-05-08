export function AbstractSection(props: {
  title: string;
  isEditing: boolean;
  value: string;
  onChange: (v: string) => void;
  readOnlyContent: string | null;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">{props.title}</h2>
      {props.isEditing ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          rows={5}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
      ) : (
        <p className="whitespace-pre-wrap text-zinc-300">
          {props.readOnlyContent ?? "—"}
        </p>
      )}
    </section>
  );
}
