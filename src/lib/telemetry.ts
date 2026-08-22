/** Redact path segments that can identify chats or other private resources. */
export function redactTelemetryUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://www.pidge.dating");
    parsed.pathname = parsed.pathname
      .replace(/^\/inbox\/[^/]+/i, "/inbox/[id]")
      .replace(/^\/api\/chats\/[^/]+/i, "/api/chats/[id]")
      .replace(/^\/api\/admin\/(?:users|reports)\/[^/]+/i, "/api/admin/[resource]/[id]");
    parsed.search = "";
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export function telemetryBeforeSend<T extends { url: string }>(event: T): T | null {
  return { ...event, url: redactTelemetryUrl(event.url) };
}
