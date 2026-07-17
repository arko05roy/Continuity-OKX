import crypto from "node:crypto";
import { ensureSchema, listContinuityRecords, listEvidenceTasks, listIncidents, listMonitoredAgents, listReliabilityProbes } from "../../../../src/db";

export const runtime = "nodejs";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    await ensureSchema();
    const [incidents, probes, evidenceTasks, records, monitoredAgents] = await Promise.all([
      listIncidents(), listReliabilityProbes(), listEvidenceTasks(), listContinuityRecords(), listMonitoredAgents(),
    ]);
    const agents = new Map<string, { agentName: string; endpointUrl: string; latestStatus: string; lastCheckedAt: string }>();
    for (const agent of monitoredAgents) agents.set(agent.endpointUrl, {agentName:agent.agentName,endpointUrl:agent.endpointUrl,latestStatus:agent.latestStatus,lastCheckedAt:agent.lastCheckedAt??agent.createdAt});
    for (const probe of probes) {
      if (!agents.has(probe.endpointUrl)) agents.set(probe.endpointUrl, { agentName: probe.agentName, endpointUrl: probe.endpointUrl, latestStatus: probe.status, lastCheckedAt: probe.completedAt });
    }
    for (const incident of incidents) {
      const key = incident.endpointUrl || `incident:${incident.agentName}`;
      if (!agents.has(key)) agents.set(key, { agentName: incident.agentName, endpointUrl: incident.endpointUrl ?? "", latestStatus: "INCIDENT", lastCheckedAt: incident.updatedAt });
    }
    return Response.json({ requestId, data: {
      agents: Array.from(agents.values()),
      incidents,
      evidenceTasks,
      records,
      counts: {
        agents: monitoredAgents.length,
        openIncidents: incidents.filter((incident) => !["RESOLVED", "RESTORED"].includes(incident.status)).length,
        evidenceTasks: evidenceTasks.filter((task) => ["OPEN", "CLAIMED", "SUBMITTED"].includes(task.assignmentStatus)).length,
        records: records.length,
      }, autonomy:{enabled:Boolean(process.env.CRON_SECRET),intervalFloorSeconds:60,nextCheckAt:monitoredAgents.filter((agent)=>agent.enabled).sort((a,b)=>Date.parse(a.nextCheckAt)-Date.parse(b.nextCheckAt))[0]?.nextCheckAt??null,activePolicies:monitoredAgents.filter((agent)=>agent.enabled).length},
    } });
  } catch {
    return Response.json({ requestId, error: "Dashboard data could not be retrieved" }, { status: 503 });
  }
}
