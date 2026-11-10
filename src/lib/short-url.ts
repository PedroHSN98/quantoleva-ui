/**
 * A short label for a file in a list of hundreds: the host, then the part of the path that tells this file
 * apart from its neighbours. The middle of long paths is the same for every file, so the END is what matters:
 *   https://cdn.site.com/a/b/c/foto-grande.jpg?v=3  ->  cdn.site.com/…/foto-grande.jpg
 *   https://s.gov.br/x/y/noticia-muito-longa/@@images/image -> s.gov.br/…/noticia-muito-longa/@@images/image
 * The full address stays available as the tooltip.
 */
const safe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export function shortUrl(url: string, max = 64): string {
  let u: URL;
  try { u = new URL(url); } catch { return url.length > max ? `${url.slice(0, max - 1)}…` : url; }

  const segs = u.pathname.split("/").filter(Boolean).map(safe);
  const plain = u.host + (segs.length ? `/${segs.join("/")}` : "/");
  if (plain.length <= max && !u.search) return plain;
  if (segs.length === 0) return u.host + "/" + (u.search ? "?…" : "");

  // Walk back from the end until we have a segment that names the file: it has an extension or is long enough.
  const tail: string[] = [];
  for (let i = segs.length - 1; i >= 0 && tail.length < 3; i--) {
    tail.unshift(segs[i]);
    if (/\.[a-z0-9]{2,5}$/i.test(segs[i]) || segs[i].length >= 16) break;
  }
  const dropped = tail.length < segs.length;
  let label = tail.join("/");
  const room = Math.max(12, max - u.host.length - 3);
  if (label.length > room) label = `…${label.slice(label.length - (room - 1))}`;
  const out = `${u.host}/${dropped ? "…/" : ""}${label}`;
  return u.search && !/\.[a-z0-9]{2,5}$/i.test(label) ? `${out}?…` : out;
}
