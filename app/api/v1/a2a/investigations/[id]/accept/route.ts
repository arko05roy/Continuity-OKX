import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, findA2AInvestigation, updateA2AInvestigation } from "../../../../../../../src/db";
import { transitionA2A } from "../../../../../../../src/a2a";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    if (investigation.status !== "QUOTED") return NextResponse.json({ requestId, error: "Only quoted investigations can be accepted" }, { status: 409 });
    if (!investigation.quoteExpiresAt || Date.parse(investigation.quoteExpiresAt) <= Date.now()) return NextResponse.json({ requestId, error: "Quote has expired" }, { status: 409 });
    const now = new Date().toISOString();
    const updated = { ...investigation, status: transitionA2A("QUOTED", "ACCEPT"), paymentStatus: "PENDING", updatedAt: now };
    await updateA2AInvestigation(updated);
    return NextResponse.json({ requestId, investigationId: updated.id, status: updated.status, paymentStatus: updated.paymentStatus,
      message: "Buyer acceptance recorded. Execution is blocked until verified OKX payment or escrow confirmation; no payment was simulated." });
  } catch { return NextResponse.json({ requestId, error: "A2A acceptance could not be persisted" }, { status: 503 }); }
}
