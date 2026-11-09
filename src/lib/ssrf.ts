import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateIp } from "./validate-url";

/** Resolves a hostname and throws if ANY address is private, loopback or link-local.
 *  Used by the worker for the first URL, every redirect and every sub-request. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked_target");
    return;
  }
  const addrs = await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked_target");
}
