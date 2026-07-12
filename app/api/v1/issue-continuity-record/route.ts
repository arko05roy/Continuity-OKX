import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, findEvidenceSubmissions, findIncident, insertContinuityRecord } from "../../../../src/db";
import { generateContinuityRecord, hashRecord, recordTypes } from "../../../../src/records";
import { paidRoute, paidRouteConfig } from "../../../../src/payments";

export const runtime = "nodejs";

const requestSchema = z.object({
  incidentId: z.string().uuid(),
  recordType: z.enum(recordTypes).default("INCIDENT_RECORD"),
}).strict();

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  try {
    await ensureSchema();
    const incident = await findIncident(parsed.data.incidentId);
    if (!incident) return NextResponse.json({ requestId, error: "Incident not found" }, { status: 404 });
    const submissions = await findEvidenceSubmissions(incident.id);
    const generated = generateContinuityRecord(incident, submissions);
    const recordId = crypto.randomUUID();
    const payload = { incidentId: incident.id, agentName: incident.agentName, recordType: parsed.data.recordType, ...generated };
    const recordHash = hashRecord(payload);
    const publicUrl = process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/records/${recordId}` : null;
    const createdAt = new Date().toISOString();
    await insertContinuityRecord({ id: recordId, incidentId: incident.id, agentName: incident.agentName,
      recordType: parsed.data.recordType, ...generated, recordHash, signature: null, publicUrl, createdAt });
    return NextResponse.json({ requestId, recordId, ...generated, recordHash, publicUrl, status: "ISSUED" }, { status: 201 });
  } catch {
    return NextResponse.json({ requestId, error: "Continuity record could not be issued" }, { status: 503 });
  }
}

export const POST = paidRoute(handler, paidRouteConfig("/api/v1/issue-continuity-record", "$0.10", "Issue a hashed Continuity Record from persisted incident and accepted evidence data."));
