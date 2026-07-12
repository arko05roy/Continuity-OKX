import crypto from "node:crypto";
import { ensureSchema, findEvidenceTask } from "../../../../../src/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!id || id.length > 100) return Response.json({ requestId, error: "Evidence task id is invalid" }, { status: 400 });
  try {
    await ensureSchema();
    const task = await findEvidenceTask(id);
    if (!task) return Response.json({ requestId, error: "Evidence task not found" }, { status: 404 });
    return Response.json({ requestId, task, submitUrl: "/api/v1/submit-evidence" });
  } catch {
    return Response.json({ requestId, error: "Evidence task could not be retrieved" }, { status: 503 });
  }
}
