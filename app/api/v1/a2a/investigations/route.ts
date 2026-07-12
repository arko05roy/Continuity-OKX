import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, insertA2AInvestigation, insertIncident } from "../../../../../src/db";
import { a2aInvestigationRequest, validateIncidentUrls } from "../../../../../src/a2a";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ requestId, error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = a2aInvestigationRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requestId, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  try { await validateIncidentUrls(parsed.data); } catch (error) { return NextResponse.json({ requestId, error: error instanceof Error ? error.message : "Invalid URL" }, { status: 400 }); }

  try {
    await ensureSchema();
    const now = new Date();
    const incidentId = crypto.randomUUID();
    const investigationId = crypto.randomUUID();
    const incidentSlug = `INC-${incidentId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const publicSlug = `A2A-${investigationId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const incident = { id: incidentId, publicSlug: incidentSlug, agentName: parsed.data.agentName, agentId: parsed.data.agentId ?? null,
      endpointUrl: parsed.data.endpointUrl ?? null, openedBy: parsed.data.openedBy, incidentType: parsed.data.incidentType,
      severity: parsed.data.severity, claim: parsed.data.claim, requestedOutcome: parsed.data.requestedOutcome,
      evidenceUrls: parsed.data.evidenceUrls, status: "OPEN", createdAt: now.toISOString(), updatedAt: now.toISOString() };
    await insertIncident(incident);
    await insertA2AInvestigation({ id: investigationId, publicSlug, incidentId, agentName: parsed.data.agentName, agentId: parsed.data.agentId ?? null,
      endpointUrl: parsed.data.endpointUrl ?? null, openedBy: parsed.data.openedBy, claim: parsed.data.claim, requestedOutcome: parsed.data.requestedOutcome,
      budgetAmount: parsed.data.budgetAmount, budgetToken: parsed.data.budgetToken, deadline: new Date(now.getTime() + parsed.data.deadlineMinutes * 60_000).toISOString(),
      deliveryInstructions: parsed.data.deliveryInstructions, status: "REQUESTED", quotedAmount: null, quotedToken: null, quotedScope: null,
      quoteExpiresAt: null, paymentStatus: "NOT_CONFIGURED", paymentReference: null, paymentNetwork: null, recordId: null, deliveryUrl: null,
      buyerDecision: null, buyerNote: null, createdAt: now.toISOString(), updatedAt: now.toISOString() });
    return NextResponse.json({ requestId, investigationId, publicSlug, incidentId, incidentSlug, status: "REQUESTED", paymentStatus: "NOT_CONFIGURED",
      nextActions: ["Issue a quote within the declared budget", "Await buyer acceptance", "Await verified OKX payment before execution"] }, { status: 201 });
  } catch { return NextResponse.json({ requestId, error: "A2A investigation could not be persisted" }, { status: 503 }); }
}
