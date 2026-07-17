import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { observeAgent } from "../../../../src/monitoring";
import { paidRoute, paidRouteConfig } from "../../../../src/payments";

export const runtime = "nodejs";
const schema=z.object({agentName:z.string().trim().min(1).max(200),endpointUrl:z.string().url(),expectedStatus:z.number().int().min(100).max(599).default(200),expectedContentType:z.string().trim().min(1).max(200).default("application/json"),timeoutMs:z.number().int().min(100).max(15_000).default(8_000)});

async function handler(request:NextRequest){const requestId=crypto.randomUUID();const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({requestId,error:"Invalid request",details:parsed.error.flatten()},{status:400});try{const observed=await observeAgent(parsed.data);return NextResponse.json({requestId,agentName:parsed.data.agentName,status:observed.result.status,http:{reachable:observed.result.reachable,statusCode:observed.result.statusCode,latencyMs:observed.result.latencyMs,contentType:observed.result.contentType},probeId:observed.probeId,summary:observed.result.summary,incident:observed.incident,recovery:observed.recovery,initialObservation:observed.initialObservation});}catch(reason){return NextResponse.json({requestId,error:reason instanceof Error?reason.message:"Agent observation failed"},{status:502});}}
export const POST=paidRoute(handler,paidRouteConfig("/api/v1/check-agent-status","$0.01","Run a real HTTPS reliability probe against an agent endpoint."));
