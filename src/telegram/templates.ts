import { buildUiLink } from "./ui-link.js";

export type DoneBatchItem = {
  id: number;
  url: string;
  title: string | null;
  abstract: string | null;
  abstractZh: string | null;
};

export function renderDoneBatchMessage(
  uiBaseUrl: string,
  items: DoneBatchItem[],
  backlog: number,
): { markdown: string; plainText: string } {
  const header =
    items.length === 1 ? "DONE: 1 bookmark" : `DONE: ${items.length} bookmarks`;
  const lines = items.map((it) => {
    const title = it.title?.trim() || "(untitled)";
    const short = (it.abstractZh ?? it.abstract ?? "").trim().slice(0, 300);
    return `
        [#${it.id}](${buildUiLink(uiBaseUrl, it.id)}) [${title}](${it.url})
        ${short ? `>${short}` : ""}

        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  });
  const markdown = [
    header,
    "",
    lines.join("\n\n"),
    "",
    `Backlog remaining: ${backlog}`,
  ].join("\n");
  return { markdown, plainText: markdown };
}

export function renderFailureMessage(
  uiBaseUrl: string,
  payload: {
    id: number;
    url: string;
    error: string;
    backlog: number;
  },
): { markdown: string; plainText: string } {
  const markdown = `
    FAILED [#${payload.id}](${buildUiLink(uiBaseUrl, payload.id)}) [${payload.url}]
    
    Reason: ${payload.error}
    
    Backlog remaining: ${payload.backlog}
    `
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  return { markdown, plainText: markdown };
}

export function renderChannelEditMessage(
  uiBaseUrl: string,
  input: {
    id: number;
    url: string;
    title: string | null;
    abstract: string | null;
    abstractZh: string | null;
  },
): { markdown: string; plainText: string } {
  const title = (input.title ?? "").trim() || "(untitled)";
  const abstractZh = (input.abstractZh ?? "").trim();
  const abstractEn = (input.abstract ?? "").trim();
  const markdown = `
      [#${input.id}](${buildUiLink(uiBaseUrl, input.id)}) [${title}](${input.url})
      >ZH: ${abstractZh || "(无)"}
      
      >EN: ${abstractEn || "(none)"}
    `
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .slice(0, 1000);
  const plainText =
    `#${input.id} ${title}\n${input.url}\nZH: ${abstractZh || "(无)"}\nEN: ${abstractEn || "(none)"}`.slice(
      0,
      1000,
    );
  return { markdown, plainText };
}
