import { isIP } from "node:net";

export type UrlCheck = { ok: true; url: string } | { ok: false; code: "invalid_url" | "blocked_target" };

/** Adds https:// when no scheme is given, then checks scheme, port and obviously private hosts.
 *  Real SSRF protection (DNS resolution + re-check on every redirect) belongs in the worker. */
export function checkUrl(input: string): UrlCheck {
  const raw = input.trim();
  if (!raw || raw.length > 2048) return { ok: false, code: "invalid_url" };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return { ok: false, code: "invalid_url" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, code: "invalid_url" };
  if (u.port && u.port !== "80" && u.port !== "443") return { ok: false, code: "blocked_target" };
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host.includes(".") && isIP(host) === 0) return { ok: false, code: "blocked_target" };
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, code: "blocked_target" };
  }
  if (isPrivateIp(host)) return { ok: false, code: "blocked_target" };
  return { ok: true, url: u.toString() };
}

export function isPrivateIp(host: string): boolean {
  const v = isIP(host);
  if (v === 4) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  if (v === 6) {
    return host === "::1" || host === "::" || host.startsWith("fc") || host.startsWith("fd") ||
      host.startsWith("fe80") || host.startsWith("::ffff:");
  }
  return false;
}
