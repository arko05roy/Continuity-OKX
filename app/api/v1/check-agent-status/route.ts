import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, insertReliabilityProbe } from "../../../../src/db";
import { paidRoute, paidRouteConfig } from "../../../../src/payments";
import { probeEndpoint, sha256 } from "../../../../src/probe";

export const runtime = "nodejs";

const statusRequest = z.object({
  agentName: z.string().trim().min(1).max(200), endpointUrl: z.string().url(),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  expectedContentType: z.string().trim().min(1).max(200).default("application/json"),
  timeoutMs: z.number().int().min(100).max(15_000).default(8_000),
});

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = statusRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  const startedAt = new Date().toISOString();
  const result = await probeEndpoint(parsed.data.endpointUrl, parsed.data.timeoutMs, parsed.data.expectedStatus, parsed.data.expectedContentType);
  const completedAt = new Date().toISOString();
  const probeId = crypto.randomUUID();
  const output = { requestId, ...result };
  await ensureSchema();
  await insertReliabilityProbe({
    id: probeId, agentName: parsed.data.agentName, endpointUrl: parsed.data.endpointUrl,
    status: result.status, startedAt, completedAt, inputHash: sha256(parsed.data), outputHash: sha256(output),
    summary: result.summary, statusCode: result.statusCode, latencyMs: result.latencyMs, contentType: result.contentType,
  });
  return NextResponse.json({ requestId, agentName: parsed.data.agentName, status: result.status,
    http: { reachable: result.reachable, statusCode: result.statusCode, latencyMs: result.latencyMs, contentType: result.contentType },
    probeId, summary: result.summary });
}

export const POST = paidRoute(handler, paidRouteConfig("/api/v1/check-agent-status", "$0.01", "Run a real HTTPS reliability probe against an agent endpoint."));
