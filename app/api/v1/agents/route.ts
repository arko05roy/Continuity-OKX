import crypto from "node:crypto";
import { z } from "zod";
import { ensureSchema, listMonitoredAgents, upsertMonitoredAgent } from "../../../../src/db";
import { assertSafeEndpoint } from "../../../../src/probe";
import { resolveAdapterKey } from "../../../../src/adapters";

export const runtime="nodejs";
const schema=z.object({agentName:z.string().trim().min(1).max(200),endpointUrl:z.string().url(),expectedStatus:z.number().int().min(100).max(599).default(200),expectedContentType:z.string().trim().min(1).max(200).default("application/json"),intervalSeconds:z.number().int().min(60).max(86400).default(60),recoveryPolicy:z.enum(["OBSERVE_ONLY","RETRY_AND_ESCALATE","AUTO_RECOVER"]).default("RETRY_AND_ESCALATE")});
export async function GET(){await ensureSchema();return Response.json({agents:await listMonitoredAgents(false,200)});}
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Invalid registration",details:parsed.error.flatten()},{status:400});try{await assertSafeEndpoint(parsed.data.endpointUrl);await ensureSchema();const configuredOrigin=(process.env.PUBLIC_BASE_URL||new URL(request.url).origin).replace(/\/$/,"");const adapterKey=resolveAdapterKey(parsed.data.endpointUrl,configuredOrigin);const agent=await upsertMonitoredAgent({id:crypto.randomUUID(),...parsed.data,adapterKey});return Response.json({agent},{status:201});}catch(reason){return Response.json({error:reason instanceof Error?reason.message:"Registration failed"},{status:400});}}
