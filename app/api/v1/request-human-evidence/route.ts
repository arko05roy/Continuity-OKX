import crypto from "node:crypto";
import { ensureSchema, findIncident, insertEvidenceTask } from "../../../../src/db";
import { requestEvidenceTask } from "../../../../src/incidents";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = requestEvidenceTask.safeParse(body);
  if (!parsed.success) return Response.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  try {
    await ensureSchema();
    const incident = await findIncident(parsed.data.incidentId);
    if (!incident) return Response.json({ requestId, error: "Incident not found" }, { status: 404 });

    const id = crypto.randomUUID();
    const now = new Date();
    const deadline = new Date(now.getTime() + parsed.data.deadlineMinutes * 60_000).toISOString();
    await insertEvidenceTask({
      id, incidentId: incident.id, taskType: parsed.data.taskType, instructions: parsed.data.instructions,
      rewardAmount: parsed.data.rewardAmount, rewardToken: parsed.data.rewardToken, deadline,
      assignedToWallet: null, assignmentStatus: "OPEN", createdAt: now.toISOString(), updatedAt: now.toISOString(),
    });
    return Response.json({ requestId, taskId: id, incidentId: incident.id, status: "OPEN", deadline,
      claimUrl: `/api/v1/evidence-tasks/${id}`, submitUrl: `/api/v1/submit-evidence` }, { status: 201 });
  } catch {
    return Response.json({ requestId, error: "Evidence task could not be persisted" }, { status: 503 });
  }
}
