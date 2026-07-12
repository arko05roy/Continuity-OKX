import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, findA2AInvestigation, findEvidenceSubmissions, findIncident, insertContinuityRecord, insertReliabilityProbe, updateA2AInvestigation } from "../../../../../../../src/db";
import { transitionA2A } from "../../../../../../../src/a2a";
import { generateContinuityRecord, hashRecord } from "../../../../../../../src/records";
import { requireInternalToken } from "../../../../../../../src/internal-auth";
import { probeEndpoint, sha256 } from "../../../../../../../src/probe";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const unauthorized = requireInternalToken(request, "A2A_EXECUTION_TOKEN");
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    if (investigation.status !== "PAYMENT_VERIFIED" || !["VERIFIED", "SETTLED"].includes(investigation.paymentStatus)) return NextResponse.json({ requestId, error: "Verified payment is required before execution" }, { status: 409 });
    if (!process.env.PUBLIC_BASE_URL) return NextResponse.json({ requestId, error: "PUBLIC_BASE_URL is required for A2A delivery" }, { status: 503 });
    const inProgress = { ...investigation, status: transitionA2A("PAYMENT_VERIFIED", "START"), updatedAt: new Date().toISOString() };
    await updateA2AInvestigation(inProgress);

    if (investigation.endpointUrl) {
      const startedAt = new Date().toISOString();
      const result = await probeEndpoint(investigation.endpointUrl, 8_000, 200, "application/json");
      const completedAt = new Date().toISOString();
      await insertReliabilityProbe({ id: crypto.randomUUID(), agentName: investigation.agentName, endpointUrl: investigation.endpointUrl,
        status: result.status, startedAt, completedAt, inputHash: sha256({ agentName: investigation.agentName, endpointUrl: investigation.endpointUrl }),
        outputHash: sha256({ requestId, ...result }), summary: result.summary, statusCode: result.statusCode, latencyMs: result.latencyMs, contentType: result.contentType });
    }

    const submissions = await findEvidenceSubmissions(investigation.incidentId);
    const hasAcceptedEvidence = submissions.some((submission) => submission.reviewStatus === "ACCEPTED" && submission.signatureValid && submission.contentHashMatched !== false);
    if (!hasAcceptedEvidence) {
      const waiting = { ...inProgress, status: transitionA2A("IN_PROGRESS", "EVIDENCE_REQUIRED"), updatedAt: new Date().toISOString() };
      await updateA2AInvestigation(waiting);
      return NextResponse.json({ requestId, investigationId: waiting.id, status: waiting.status, nextAction: "Create and review signed evidence before delivery" }, { status: 202 });
    }

    const incident = await findIncident(investigation.incidentId);
    if (!incident) return NextResponse.json({ requestId, error: "Investigation incident not found" }, { status: 503 });
    const generated = generateContinuityRecord(incident, submissions);
    const recordId = crypto.randomUUID();
    const recordPayload = { incidentId: investigation.incidentId, agentName: investigation.agentName, recordType: "RECOVERY_RECORD" as const, ...generated };
    const recordHash = hashRecord(recordPayload);
    const publicUrl = `${process.env.PUBLIC_BASE_URL!.replace(/\/+$/, "")}/records/${recordId}`;
    await insertContinuityRecord({ id: recordId, incidentId: investigation.incidentId, agentName: investigation.agentName, recordType: "RECOVERY_RECORD",
      ...generated, recordHash, signature: null, publicUrl, createdAt: new Date().toISOString() });
    const delivered = { ...inProgress, status: transitionA2A("IN_PROGRESS", "DELIVER"), recordId, deliveryUrl: publicUrl, updatedAt: new Date().toISOString() };
    await updateA2AInvestigation(delivered);
    return NextResponse.json({ requestId, investigationId: delivered.id, status: delivered.status, recordId, deliveryUrl: publicUrl, verdict: generated.verdict, confidence: generated.confidence });
  } catch { return NextResponse.json({ requestId, error: "A2A investigation execution failed" }, { status: 503 }); }
}
