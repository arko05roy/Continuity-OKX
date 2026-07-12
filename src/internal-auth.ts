import { NextResponse } from "next/server";

export function requireInternalToken(request: Request, variableName: "REVIEWER_TOKEN" | "A2A_EXECUTION_TOKEN") {
  const token = process.env[variableName];
  if (!token) return NextResponse.json({ error: `${variableName} is not configured` }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${token}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
