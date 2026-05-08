/** Collapse runs of whitespace and trim. */
export function cleanWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Strip script/style and HTML tags to approximate plain text (no entity decoding). */
export function htmlToPlainText(html: string): string {
  return cleanWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

export function nonEmpty(s: string | undefined | null): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
