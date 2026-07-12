import crypto from "node:crypto";
import { z } from "zod";
import { ensureSchema, findEvidenceSubmissions, findIncident, insertContinuityRecord } from "../../../../src/db";
import { generateContinuityRecord, hashRecord, recordTypes } from "../../../../src/records";

export const runtime = "nodejs";

const requestSchema = z.object({
  incidentId: z.string().uuid(),
  recordType: z.enum(recordTypes).default("INCIDENT_RECORD"),
}).strict();

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  try {
    await ensureSchema();
    const incident = await findIncident(parsed.data.incidentId);
    if (!incident) return Response.json({ requestId, error: "Incident not found" }, { status: 404 });
    const submissions = await findEvidenceSubmissions(incident.id);
    const generated = generateContinuityRecord(incident, submissions);
    const recordId = crypto.randomUUID();
    const payload = { incidentId: incident.id, agentName: incident.agentName, recordType: parsed.data.recordType, ...generated };
    const recordHash = hashRecord(payload);
    const publicUrl = process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/records/${recordId}` : null;
    const createdAt = new Date().toISOString();
    await insertContinuityRecord({ id: recordId, incidentId: incident.id, agentName: incident.agentName,
      recordType: parsed.data.recordType, ...generated, recordHash, signature: null, publicUrl, createdAt });
    return Response.json({ requestId, recordId, ...generated, recordHash, publicUrl, status: "ISSUED" }, { status: 201 });
  } catch {
    return Response.json({ requestId, error: "Continuity record could not be issued" }, { status: 503 });
  }
}
