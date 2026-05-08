import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Innertube } from "youtubei.js";

const execFileAsync = promisify(execFile);

let innertube: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!innertube) {
    innertube = await Innertube.create();
  }
  return innertube;
}

type SegmentLike = {
  type?: string;
  snippet?: { toString: () => string };
  start_time_text?: { toString: () => string };
};

function cleanWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function paragraphizeChunks(chunks: string[], targetLength = 320): string {
  const paragraphs: string[] = [];
  let current = "";
  for (const chunk of chunks) {
    const next = current ? `${current} ${chunk}` : chunk;
    const endsSentence = /[.!?。！？]$/.test(chunk);
    if (next.length >= targetLength && endsSentence) {
      paragraphs.push(next);
      current = "";
    } else {
      current = next;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs.join("\n\n");
}

function transcriptInfoToText(transcriptInfo: {
  selectedLanguage: string;
  transcript: { content?: unknown };
}): string {
  const panel = transcriptInfo.transcript?.content as
    | { body?: { initial_segments?: SegmentLike[] } }
    | null
    | undefined;
  const segments = panel?.body?.initial_segments;
  if (!segments?.length) return "";
  const chunks: string[] = [];
  for (const seg of segments) {
    if (seg.type === "TranscriptSegment") {
      const time = seg.start_time_text?.toString?.() ?? "";
      const text = cleanWhitespace(seg.snippet?.toString?.() ?? "");
      if (text) chunks.push(time ? `[${time}] ${text}` : text);
    }
  }
  return paragraphizeChunks(chunks);
}

export type YoutubeDetails = {
  title: string | null;
  channel: string | null;
  durationSec: number | null;
};

export async function fetchYoutubeDetails(
  videoId: string,
): Promise<YoutubeDetails> {
  const yt = await getInnertube();
  const info = await yt.getInfo(videoId);
  const basic = info.basic_info;
  const duration =
    typeof basic.duration === "number"
      ? basic.duration
      : basic.duration != null
        ? Number(basic.duration)
        : null;
  return {
    title: basic.title ?? null,
    channel: basic.channel?.name ?? basic.author ?? null,
    durationSec: Number.isFinite(duration) ? duration : null,
  };
}

export async function fetchYoutubeTranscriptYoutubei(
  videoId: string,
): Promise<{ text: string; lang: string } | null> {
  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);
    const transcriptInfo = await info.getTranscript();
    const text = transcriptInfoToText(transcriptInfo);
    const lang = transcriptInfo.selectedLanguage || "unknown";
    if (!text.trim()) return null;
    return { text, lang };
  } catch {
    return null;
  }
}

function stripVttToText(vtt: string): string {
  const blocks = vtt.split(/\r?\n\r?\n/);
  const chunks: string[] = [];
  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    if (
      lines[0]?.startsWith("WEBVTT") ||
      lines[0]?.startsWith("NOTE") ||
      lines[0] === "STYLE"
    ) {
      continue;
    }
    const timeLine = lines.find((x) => x.includes("-->"));
    const textLines = lines.filter(
      (x) => !x.includes("-->") && !/^\d+$/.test(x) && !/^align:/i.test(x),
    );
    const text = cleanWhitespace(textLines.join(" ").replace(/<[^>]+>/g, " "));
    if (!text) continue;
    const ts = timeLine
      ?.split("-->")[0]
      ?.trim()
      ?.split(".")[0]
      ?.replace(/^00:/, "");
    chunks.push(ts ? `[${ts}] ${text}` : text);
  }
  return paragraphizeChunks(chunks);
}

export async function fetchYoutubeTranscriptYtdlp(
  pageUrl: string,
): Promise<{ text: string; lang: string } | null> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bm-ytdlp-"));
  try {
    const outTemplate = path.join(tmp, "%(id)s");
    await execFileAsync(
      "yt-dlp",
      [
        "--skip-download",
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang",
        "en,en-US,en-orig",
        "--sub-format",
        "vtt",
        "-o",
        outTemplate,
        pageUrl,
      ],
      { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
    );
    const files = await fs.readdir(tmp);
    const vtt = files.find((f) => f.endsWith(".vtt"));
    if (!vtt) return null;
    const raw = await fs.readFile(path.join(tmp, vtt), "utf8");
    const text = stripVttToText(raw);
    if (!text.trim()) return null;
    const langMatch = vtt.match(/\.([a-zA-Z-]+)\.vtt$/);
    return { text, lang: langMatch?.[1] ?? "en" };
  } catch {
    return null;
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

export async function fetchYoutubeTranscript(
  videoId: string,
  pageUrl: string,
): Promise<{ text: string; lang: string } | null> {
  const primary = await fetchYoutubeTranscriptYoutubei(videoId);
  if (primary?.text.trim()) return primary;
  return fetchYoutubeTranscriptYtdlp(pageUrl);
}
