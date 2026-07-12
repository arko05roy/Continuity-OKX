import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transitionA2A } from "../../../../../../../src/a2a";
import { ensureSchema, findA2AInvestigation, updateA2AInvestigation } from "../../../../../../../src/db";
import { requireInternalToken } from "../../../../../../../src/internal-auth";

export const runtime = "nodejs";

const responseRequest = z.object({ decision: z.enum(["ACCEPT", "REJECT"]), note: z.string().trim().min(1).max(20_000) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const unauthorized = requireInternalToken(request, "A2A_EXECUTION_TOKEN");
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = responseRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid buyer response", details: parsed.error.flatten() }, { status: 400 });
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    if (investigation.status !== "DELIVERED") return NextResponse.json({ requestId, error: "Only delivered investigations can receive a buyer response" }, { status: 409 });
    const event = parsed.data.decision === "ACCEPT" ? "BUYER_ACCEPT" : "BUYER_REJECT";
    const updated = { ...investigation, status: transitionA2A("DELIVERED", event), buyerDecision: parsed.data.decision, buyerNote: parsed.data.note, updatedAt: new Date().toISOString() };
    await updateA2AInvestigation(updated);
    return NextResponse.json({ requestId, investigationId: updated.id, status: updated.status, buyerDecision: updated.buyerDecision });
  } catch { return NextResponse.json({ requestId, error: "Buyer response could not be recorded" }, { status: 503 }); }
}
