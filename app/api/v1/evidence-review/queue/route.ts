import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, listPendingEvidenceSubmissions } from "../../../../../src/db";
import { requireInternalToken } from "../../../../../src/internal-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const unauthorized = requireInternalToken(request, "REVIEWER_TOKEN");
  if (unauthorized) return unauthorized;
  try {
    await ensureSchema();
    return NextResponse.json({ requestId, submissions: await listPendingEvidenceSubmissions() });
  } catch { return NextResponse.json({ requestId, error: "Evidence review queue could not be retrieved" }, { status: 503 }); }
}
