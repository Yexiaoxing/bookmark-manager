const URL_IN_TEXT = /https?:\/\/[^\s<>"{}|\\^`[\]()]+/gi;
const TWITTER_RELAY_HOST_RE =
  /^(?:www\.)?(?:vxtwitter\.com|fxtwitter\.com|fixvx\.com|fixupx\.com)$/i;

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_IN_TEXT);
  if (!matches) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of matches) {
    const trimmed = u.replace(/[),.;]+$/g, "");
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export function normalizeUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(mapRelayUrl(raw.trim()));
  } catch {
    return raw.trim().toLowerCase();
  }
  u.hash = "";
  const drop = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "mc_cid",
    "mc_eid",
  ]);
  for (const k of [...u.searchParams.keys()]) {
    if (k.toLowerCase().startsWith("utm_") || drop.has(k.toLowerCase())) {
      u.searchParams.delete(k);
    }
  }
  const qs = u.searchParams.toString();
  u.search = qs ? `?${qs}` : "";
  if (
    (u.protocol === "http:" && u.port === "80") ||
    (u.protocol === "https:" && u.port === "443")
  ) {
    u.port = "";
  }
  return u.toString();
}

export function mapRelayUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return raw.trim();
  }
  if (TWITTER_RELAY_HOST_RE.test(u.hostname)) {
    u.hostname = "x.com";
  }
  if (u.hostname.toLowerCase() === "m.cnbeta.com") {
    u.hostname = "m.cnbeta.com.tw";
  }
  return u.toString();
}

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export type LinkKind = "youtube" | "article" | "other";

export function classifyUrl(url: string): { kind: LinkKind; videoId?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "other" };
  }
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    if (id && /^[\w-]{11}$/.test(id)) return { kind: "youtube", videoId: id };
  }
  if (YT_HOSTS.has(parsed.hostname.toLowerCase()) || YT_HOSTS.has(host)) {
    const v = parsed.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return { kind: "youtube", videoId: v };
    const m = parsed.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/);
    if (m?.[2]) return { kind: "youtube", videoId: m[2] };
  }
  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    return { kind: "article" };
  }
  return { kind: "other" };
}
