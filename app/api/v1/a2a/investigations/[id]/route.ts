import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, findA2AInvestigation } from "../../../../../../src/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;
  if (!id || id.length > 200) return NextResponse.json({ requestId, error: "Investigation id is invalid" }, { status: 400 });
  try {
    await ensureSchema();
    const investigation = await findA2AInvestigation(id);
    if (!investigation) return NextResponse.json({ requestId, error: "A2A investigation not found" }, { status: 404 });
    return NextResponse.json({ requestId, investigation });
  } catch { return NextResponse.json({ requestId, error: "A2A investigation could not be retrieved" }, { status: 503 }); }
}
