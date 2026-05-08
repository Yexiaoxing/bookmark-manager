import { describe, expect, it } from "vitest";
import {
  classifyUrl,
  extractUrlsFromText,
  mapRelayUrl,
  normalizeUrl,
} from "../src/services/url.js";

describe("extractUrlsFromText", () => {
  it("extracts urls and trims trailing punctuation", () => {
    const text =
      "Read https://example.com/a). Then watch https://youtu.be/dQw4w9WgXcQ.";
    expect(extractUrlsFromText(text)).toEqual([
      "https://example.com/a",
      "https://youtu.be/dQw4w9WgXcQ",
    ]);
  });

  it("deduplicates repeated urls", () => {
    const text = "https://example.com https://example.com";
    expect(extractUrlsFromText(text)).toEqual(["https://example.com"]);
  });
});

describe("normalizeUrl", () => {
  it("removes tracking params and hash", () => {
    const normalized = normalizeUrl(
      "https://example.com/path?utm_source=t&fbclid=1&a=2#hello",
    );
    expect(normalized).toBe("https://example.com/path?a=2");
  });

  it("lowercases fallback for invalid url", () => {
    expect(normalizeUrl(" NOT A URL ")).toBe("not a url");
  });

  it("maps twitter relay domains to canonical x.com", () => {
    expect(
      normalizeUrl("https://vxtwitter.com/jack/status/20?utm_source=t#frag"),
    ).toBe("https://x.com/jack/status/20");
  });
});

describe("mapRelayUrl", () => {
  it("maps vxtwitter host to x.com", () => {
    expect(mapRelayUrl("https://vxtwitter.com/jack/status/20")).toBe(
      "https://x.com/jack/status/20",
    );
  });

  it("keeps non-relay urls unchanged", () => {
    expect(mapRelayUrl("https://example.com/path?a=1")).toBe(
      "https://example.com/path?a=1",
    );
  });

  it("maps m.cnbeta.com to m.cnbeta.com.tw", () => {
    expect(mapRelayUrl("https://m.cnbeta.com/view/123.htm")).toBe(
      "https://m.cnbeta.com.tw/view/123.htm",
    );
  });
});

describe("classifyUrl", () => {
  it("detects youtu.be links", () => {
    expect(classifyUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("detects normal articles", () => {
    expect(classifyUrl("https://example.com/post")).toEqual({
      kind: "article",
    });
  });
});
