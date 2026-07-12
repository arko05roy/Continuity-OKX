import crypto from "node:crypto";
import { ensureSchema, listContinuityRecords, listIncidents, listReliabilityProbes } from "../../../../../../src/db";
import { buildReliabilityProfile } from "../../../../../../src/reliability";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  const agentName = decodeURIComponent(id);
  if (!agentName || agentName.length > 200) return Response.json({ requestId, error: "Agent id is invalid" }, { status: 400 });
  try {
    await ensureSchema();
    const [probes, incidents, records] = await Promise.all([listReliabilityProbes(), listIncidents(), listContinuityRecords()]);
    const hasAgent = probes.some((probe) => probe.agentName === agentName) || incidents.some((incident) => incident.agentName === agentName) || records.some((record) => record.agentName === agentName);
    if (!hasAgent) return Response.json({ requestId, error: "Agent not found" }, { status: 404 });
    return Response.json({ requestId, profile: buildReliabilityProfile(agentName, probes, incidents, records) });
  } catch {
    return Response.json({ requestId, error: "Reliability profile could not be retrieved" }, { status: 503 });
  }
}
