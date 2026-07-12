import crypto from "node:crypto";
import { ensureSchema, findContinuityRecord } from "../../../../../src/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!id || id.length > 100) return Response.json({ requestId, error: "Record id is invalid" }, { status: 400 });
  try {
    await ensureSchema();
    const record = await findContinuityRecord(id);
    if (!record) return Response.json({ requestId, error: "Continuity record not found" }, { status: 404 });
    return Response.json({ requestId, record });
  } catch {
    return Response.json({ requestId, error: "Continuity record could not be retrieved" }, { status: 503 });
  }
}
