import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { a2aQuoteRequest, quoteFitsBudget, transitionA2A } from "../../../../../../../src/a2a";
import { ensureSchema, findA2AInvestigation, updateA2AInvestigation } from "../../../../../../../src/db";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = a2aQuoteRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid quote", details: parsed.error.flatten() }, { status: 400 });
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    if (investigation.status !== "REQUESTED") return NextResponse.json({ requestId, error: "Investigation is not awaiting a quote" }, { status: 409 });
    if (parsed.data.quotedToken !== investigation.budgetToken) return NextResponse.json({ requestId, error: "Quote token must match the declared budget token" }, { status: 400 });
    if (!quoteFitsBudget(parsed.data.quotedAmount, investigation.budgetAmount)) return NextResponse.json({ requestId, error: "Quote exceeds the declared budget" }, { status: 400 });
    const now = new Date();
    const updated = { ...investigation, status: transitionA2A("REQUESTED", "QUOTE"), quotedAmount: parsed.data.quotedAmount,
      quotedToken: parsed.data.quotedToken, quotedScope: parsed.data.scope, quoteExpiresAt: new Date(now.getTime() + parsed.data.expiresInMinutes * 60_000).toISOString(), updatedAt: now.toISOString() };
    await updateA2AInvestigation(updated);
    return NextResponse.json({ requestId, investigationId: updated.id, status: updated.status, quote: { amount: updated.quotedAmount, token: updated.quotedToken, scope: updated.quotedScope, expiresAt: updated.quoteExpiresAt }, paymentStatus: updated.paymentStatus });
  } catch { return NextResponse.json({ requestId, error: "A2A quote could not be persisted" }, { status: 503 }); }
}
