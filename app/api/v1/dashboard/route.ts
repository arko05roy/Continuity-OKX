import crypto from "node:crypto";
import { ensureSchema, listContinuityRecords, listEvidenceTasks, listIncidents, listReliabilityProbes } from "../../../../src/db";

export const runtime = "nodejs";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    await ensureSchema();
    const [incidents, probes, evidenceTasks, records] = await Promise.all([
      listIncidents(), listReliabilityProbes(), listEvidenceTasks(), listContinuityRecords(),
    ]);
    const agents = new Map<string, { agentName: string; endpointUrl: string; latestStatus: string; lastCheckedAt: string }>();
    for (const probe of probes) {
      if (!agents.has(probe.agentName)) agents.set(probe.agentName, { agentName: probe.agentName, endpointUrl: probe.endpointUrl, latestStatus: probe.status, lastCheckedAt: probe.completedAt });
    }
    for (const incident of incidents) {
      if (!agents.has(incident.agentName)) agents.set(incident.agentName, { agentName: incident.agentName, endpointUrl: incident.endpointUrl ?? "", latestStatus: "INCIDENT", lastCheckedAt: incident.updatedAt });
    }
    return Response.json({ requestId, data: {
      agents: Array.from(agents.values()),
      incidents,
      evidenceTasks,
      records,
      counts: {
        agents: agents.size,
        openIncidents: incidents.filter((incident) => !["RESOLVED", "RESTORED"].includes(incident.status)).length,
        evidenceTasks: evidenceTasks.filter((task) => ["OPEN", "CLAIMED", "SUBMITTED"].includes(task.assignmentStatus)).length,
        records: records.length,
      },
    } });
  } catch {
    return Response.json({ requestId, error: "Dashboard data could not be retrieved" }, { status: 503 });
  }
}
