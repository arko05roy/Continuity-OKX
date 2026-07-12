import crypto from "node:crypto";
import { ensureSchema, insertIncident } from "../../../../src/db";
import { openIncidentRequest, validateIncidentUrls } from "../../../../src/incidents";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = openIncidentRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await validateIncidentUrls(parsed.data);
  } catch (error) {
    return Response.json({ requestId, error: error instanceof Error ? error.message : "Invalid URL" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const publicSlug = `INC-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const now = new Date().toISOString();
  const incident = {
    id,
    publicSlug,
    ...parsed.data,
    agentId: parsed.data.agentId ?? null,
    endpointUrl: parsed.data.endpointUrl ?? null,
    evidenceUrls: parsed.data.evidenceUrls,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await ensureSchema();
    await insertIncident(incident);
  } catch {
    return Response.json({ requestId, error: "Incident could not be persisted" }, { status: 503 });
  }

  return Response.json({
    requestId,
    incidentId: id,
    publicSlug,
    status: incident.status,
    nextActions: ["Request human evidence", "Run an agent availability probe", "Generate a preliminary continuity record"],
  }, { status: 201 });
}
