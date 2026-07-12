import type { ContinuityRecordRecord, IncidentRecord, ReliabilityProbeRecord } from "./db";

export type ReliabilityProfile = {
  agentName: string;
  continuityScore: number | null;
  status: "HEALTHY" | "WATCHLIST" | "DEGRADED" | "HIGH_RISK" | "UNAVAILABLE" | "INCONCLUSIVE";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  signals: {
    uptime: "PASS" | "WARN" | "FAIL" | "UNOBSERVED";
    openCriticalIncidents: number;
    validatedRecords: number;
    observedProbes: number;
  };
  lastCheckedAt: string | null;
  publicRecords: Pick<ContinuityRecordRecord, "id" | "recordType" | "verdict" | "recordHash" | "createdAt">[];
};

export function buildReliabilityProfile(agentName: string, probes: ReliabilityProbeRecord[], incidents: IncidentRecord[], records: ContinuityRecordRecord[]): ReliabilityProfile {
  const agentProbes = probes.filter((probe) => probe.agentName === agentName);
  const agentIncidents = incidents.filter((incident) => incident.agentName === agentName);
  const agentRecords = records.filter((record) => record.agentName === agentName);
  const latestProbe = agentProbes[0];
  const openCriticalIncidents = agentIncidents.filter((incident) => incident.severity === "CRITICAL" && !["RESOLVED", "RESTORED"].includes(incident.status)).length;
  const uptime = latestProbe ? latestProbe.status as "PASS" | "WARN" | "FAIL" : "UNOBSERVED";
  const validatedRecords = agentRecords.filter((record) => record.verdict !== "INCONCLUSIVE");
  const hasEnoughForScore = agentProbes.length > 0 && validatedRecords.length > 0;
  const continuityScore = hasEnoughForScore
    ? Math.max(0, Math.min(100, (uptime === "PASS" ? 70 : uptime === "WARN" ? 45 : 15) - openCriticalIncidents * 20 + Math.min(agentRecords.length * 5, 30)))
    : null;
  const status = continuityScore === null ? "INCONCLUSIVE" : continuityScore >= 90 ? "HEALTHY" : continuityScore >= 75 ? "WATCHLIST" : continuityScore >= 50 ? "DEGRADED" : continuityScore >= 25 ? "HIGH_RISK" : "UNAVAILABLE";
  const confidence = continuityScore === null ? "LOW" : agentProbes.length >= 3 && agentRecords.length >= 3 ? "HIGH" : "MEDIUM";
  return {
    agentName, continuityScore, status, confidence,
    signals: { uptime, openCriticalIncidents, validatedRecords: validatedRecords.length, observedProbes: agentProbes.length },
    lastCheckedAt: latestProbe?.completedAt ?? null,
    publicRecords: agentRecords.map(({ id, recordType, verdict, recordHash, createdAt }) => ({ id, recordType, verdict, recordHash, createdAt })),
  };
}
