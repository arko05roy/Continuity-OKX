import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, findEvidenceSubmission, reviewEvidenceSubmission } from "../../../../../../src/db";
import { requireInternalToken } from "../../../../../../src/internal-auth";

export const runtime = "nodejs";

const reviewRequest = z.object({ decision: z.enum(["ACCEPTED", "REJECTED"]), reviewerNotes: z.string().trim().min(1).max(20_000) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const unauthorized = requireInternalToken(request, "REVIEWER_TOKEN");
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = reviewRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid review", details: parsed.error.flatten() }, { status: 400 });
  try {
    await ensureSchema();
    const submission = await findEvidenceSubmission(id);
    if (!submission) return NextResponse.json({ requestId, error: "Evidence submission not found" }, { status: 404 });
    if (submission.reviewStatus !== "PENDING") return NextResponse.json({ requestId, error: "Evidence submission has already been reviewed" }, { status: 409 });
    if (parsed.data.decision === "ACCEPTED" && (!submission.signatureValid || submission.contentHashMatched === false)) {
      return NextResponse.json({ requestId, error: "Invalid signature or content hash cannot be accepted" }, { status: 409 });
    }
    const reviewedAt = new Date().toISOString();
    await reviewEvidenceSubmission(id, parsed.data.decision, parsed.data.reviewerNotes, reviewedAt);
    return NextResponse.json({ requestId, submissionId: id, reviewStatus: parsed.data.decision, reviewedAt });
  } catch { return NextResponse.json({ requestId, error: "Evidence submission could not be reviewed" }, { status: 503 }); }
}
