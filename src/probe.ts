import dns from "node:dns/promises";
import net from "node:net";
import crypto from "node:crypto";

const blockedHostnames = new Set(["localhost", "localhost.localdomain"]);

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  return octets.length === 4 && (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254)
  );
}

function isBlockedAddress(address: string): boolean {
  if (net.isIPv4(address)) return isPrivateIpv4(address);
  if (!net.isIPv6(address)) return true;
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function assertSafeEndpoint(endpointUrl: string): Promise<URL> {
  const url = new URL(endpointUrl);
  if (url.protocol !== "https:") throw new Error("endpointUrl must use HTTPS");
  if (url.username || url.password) throw new Error("endpointUrl must not contain credentials");
  if (blockedHostnames.has(url.hostname.toLowerCase())) throw new Error("endpointUrl hostname is not allowed");

  const addresses = net.isIP(url.hostname) ? [url.hostname] : (await dns.lookup(url.hostname, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isBlockedAddress)) throw new Error("endpointUrl resolves to a private or local address");
  return url;
}

export function sha256(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function sha256Text(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export type ProbeResult = {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "ERROR";
  reachable: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  contentType: string | null;
  summary: string;
};

export async function probeEndpoint(endpointUrl: string, timeoutMs: number, expectedStatus: number, expectedContentType: string): Promise<ProbeResult> {
  const url = await assertSafeEndpoint(endpointUrl);
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: "GET", redirect: "error", signal: controller.signal });
    const latencyMs = Math.round(performance.now() - started);
    const contentType = response.headers.get("content-type");
    const statusMatches = response.status === expectedStatus;
    const contentTypeMatches = !contentType || contentType.toLowerCase().includes(expectedContentType.toLowerCase());
    const healthy = statusMatches && contentTypeMatches;
    return {
      status: healthy ? "HEALTHY" : "DEGRADED",
      reachable: true,
      statusCode: response.status,
      latencyMs,
      contentType,
      summary: healthy ? "Endpoint responded as expected" : "Endpoint responded, but did not match the declared contract",
    };
  } catch (error) {
    return { status: "UNAVAILABLE", reachable: false, statusCode: null, latencyMs: null, contentType: null, summary: error instanceof Error ? error.message : "Probe failed" };
  } finally {
    clearTimeout(timeout);
  }
}
