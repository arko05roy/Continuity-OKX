import crypto from "node:crypto";
import { verifyTypedData, isAddress } from "viem";
import { ensureSchema, findEvidenceTask, insertEvidenceSubmission } from "../../../../src/db";
import { sha256Text } from "../../../../src/probe";
import { submitEvidenceRequest } from "../../../../src/incidents";

export const runtime = "nodejs";

const domain = { name: "Continuity Evidence", version: "1", chainId: 196 } as const;
const types = { Evidence: [
  { name: "taskId", type: "string" }, { name: "incidentId", type: "string" },
  { name: "contentHash", type: "bytes32" }, { name: "statementHash", type: "bytes32" },
  { name: "submittedAt", type: "uint256" },
] } as const;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = submitEvidenceRequest.safeParse(body);
  if (!parsed.success) return Response.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  if (!isAddress(parsed.data.walletAddress)) return Response.json({ requestId, error: "walletAddress is invalid" }, { status: 400 });

  try {
    await ensureSchema();
    const task = await findEvidenceTask(parsed.data.taskId);
    if (!task) return Response.json({ requestId, error: "Evidence task not found" }, { status: 404 });
    if (task.assignmentStatus !== "OPEN" && task.assignmentStatus !== "CLAIMED") return Response.json({ requestId, error: "Evidence task is not accepting submissions" }, { status: 409 });
    if (Date.parse(task.deadline) < Date.now()) return Response.json({ requestId, error: "Evidence task deadline has passed" }, { status: 409 });

    const statementHash = sha256Text(parsed.data.statement);
    const suppliedContent = parsed.data.content;
    const computedContentHash = suppliedContent === undefined
      ? (parsed.data.evidenceType === "TEXT" ? sha256Text(parsed.data.statement) : null)
      : sha256Text(suppliedContent);
    const contentHash = computedContentHash ?? parsed.data.contentHash;
    if (!contentHash) return Response.json({ requestId, error: "contentHash is required when content cannot be hashed by the server" }, { status: 400 });
    const contentHashMatched = computedContentHash === null ? null : computedContentHash === parsed.data.contentHash || parsed.data.contentHash === undefined;
    if (contentHashMatched === false) return Response.json({ requestId, error: "contentHash does not match the submitted content" }, { status: 400 });
    const signedAtSeconds = BigInt(Math.floor(Date.parse(parsed.data.signedAt) / 1000));
    let signatureValid = false;
    try {
      signatureValid = await verifyTypedData({
        address: parsed.data.walletAddress as `0x${string}`, domain, types, primaryType: "Evidence",
        message: { taskId: task.id, incidentId: task.incidentId, contentHash: `0x${contentHash}` as `0x${string}`, statementHash: `0x${statementHash}` as `0x${string}`, submittedAt: signedAtSeconds },
        signature: parsed.data.signature as `0x${string}`,
      });
    } catch {
      signatureValid = false;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await insertEvidenceSubmission({ id, taskId: task.id, incidentId: task.incidentId, submittedByWallet: parsed.data.walletAddress,
      evidenceType: parsed.data.evidenceType, contentUri: parsed.data.contentUri ?? null, contentHash, statement: parsed.data.statement,
      statementHash, signature: parsed.data.signature, signedAt: parsed.data.signedAt, signatureValid, contentHashMatched,
      reviewStatus: "PENDING", createdAt: now });
    return Response.json({ requestId, submissionId: id, verification: { signatureValid, taskMatchesIncident: true, contentHashMatched, deadlineMet: true }, status: "PENDING_REVIEW" }, { status: 201 });
  } catch {
    return Response.json({ requestId, error: "Evidence submission could not be persisted" }, { status: 503 });
  }
}
