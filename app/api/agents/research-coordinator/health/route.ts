import { ensureSchema, getControlledAgentState } from "../../../../../src/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const runtime = await getControlledAgentState();
    const common = { service: "Research Coordinator", state: runtime.state, observedAt: new Date().toISOString(), stateChangedAt: runtime.updatedAt };
    if (runtime.state === "FAILED") return Response.json({ ...common, ok: false, error: runtime.failureMode ?? "UPSTREAM_HANDOFF_TIMEOUT", queueDepth: 7 }, { status: 503, headers: { "cache-control": "no-store" } });
    if (runtime.state === "RECOVERING") return Response.json({ ...common, ok: false, message: "Worker restart in progress", queueDepth: 3 }, { status: 503, headers: { "cache-control": "no-store", "retry-after": "5" } });
    return Response.json({ ...common, ok: true, queueDepth: 0, lastJobStatus: "COMPLETED" }, { status: 200, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, state: "UNAVAILABLE", error: "Runtime state unavailable", observedAt: new Date().toISOString() }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
