import crypto from "node:crypto";
import { z } from "zod";
import { ensureSchema, setControlledAgentState } from "../../../../src/db";

export const runtime = "nodejs";

const requestSchema = z.object({ state: z.enum(["HEALTHY", "FAILED", "RECOVERING"]), failureMode: z.string().trim().min(1).max(120).optional() });

function authorized(request: Request) {
  const configured = process.env.DEMO_CONTROL_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!configured || !supplied || configured.length !== supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid control request", details: parsed.error.flatten() }, { status: 400 });
  await ensureSchema();
  const runtime = await setControlledAgentState(parsed.data.state, parsed.data.state === "FAILED" ? parsed.data.failureMode ?? "UPSTREAM_HANDOFF_TIMEOUT" : null);
  return Response.json({ agentId: "research-coordinator", ...runtime }, { headers: { "cache-control": "no-store" } });
}
