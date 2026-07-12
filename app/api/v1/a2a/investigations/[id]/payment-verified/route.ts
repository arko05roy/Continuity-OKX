import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, findA2AInvestigation, updateA2AInvestigation } from "../../../../../../../src/db";
import { transitionA2A } from "../../../../../../../src/a2a";
import { requireInternalToken } from "../../../../../../../src/internal-auth";

export const runtime = "nodejs";

const paymentVerification = z.object({
  paymentReference: z.string().trim().min(1).max(500),
  network: z.literal("eip155:196"),
  settlementStatus: z.enum(["VERIFIED", "SETTLED"]),
}).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const unauthorized = requireInternalToken(request, "A2A_EXECUTION_TOKEN");
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = paymentVerification.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid payment verification", details: parsed.error.flatten() }, { status: 400 });
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    if (investigation.status !== "ACCEPTED_PENDING_PAYMENT" || investigation.paymentStatus !== "PENDING") return NextResponse.json({ requestId, error: "Investigation is not awaiting payment verification" }, { status: 409 });
    const updated = { ...investigation, status: transitionA2A("ACCEPTED_PENDING_PAYMENT", "PAYMENT_VERIFIED"), paymentStatus: parsed.data.settlementStatus,
      paymentReference: parsed.data.paymentReference, paymentNetwork: parsed.data.network, updatedAt: new Date().toISOString() };
    await updateA2AInvestigation(updated);
    return NextResponse.json({ requestId, investigationId: updated.id, status: updated.status, paymentStatus: updated.paymentStatus });
  } catch { return NextResponse.json({ requestId, error: "A2A payment verification could not be recorded" }, { status: 503 }); }
}
