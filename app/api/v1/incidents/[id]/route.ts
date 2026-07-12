import crypto from "node:crypto";
import { ensureSchema, findIncident } from "../../../../../src/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!id || id.length > 200) return Response.json({ requestId, error: "Incident id is invalid" }, { status: 400 });

  try {
    await ensureSchema();
    const incident = await findIncident(id);
    if (!incident) return Response.json({ requestId, error: "Incident not found" }, { status: 404 });
    return Response.json({ requestId, incident });
  } catch {
    return Response.json({ requestId, error: "Incident could not be retrieved" }, { status: 503 });
  }
}
