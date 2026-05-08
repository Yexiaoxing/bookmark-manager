export function classifyFetchNetworkError(err: unknown): {
  kind: "dns_nxdomain" | "cert_issue" | "network_other";
  code?: string;
} | null {
  if (!(err instanceof Error)) return null;
  const cause =
    err.cause && typeof err.cause === "object"
      ? (err.cause as Record<string, unknown>)
      : null;
  const codeRaw = cause?.code;
  const code = typeof codeRaw === "string" ? codeRaw : undefined;
  const msg = err.message.toLowerCase();
  const causeMsg = String(cause?.message ?? "").toLowerCase();
  const combined = `${msg} ${causeMsg}`;

  if (code === "ENOTFOUND" || combined.includes("nxdomain")) {
    return { kind: "dns_nxdomain", code };
  }
  if (
    code?.startsWith("ERR_TLS_") ||
    code?.startsWith("CERT_") ||
    combined.includes("certificate") ||
    combined.includes("tls")
  ) {
    return { kind: "cert_issue", code };
  }
  if (code) {
    return { kind: "network_other", code };
  }
  return null;
}
