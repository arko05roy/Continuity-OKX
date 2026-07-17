import { ensureSchema, listMonitoredAgents } from "../../../../src/db";
import { observeAgent } from "../../../../src/monitoring";

export const runtime="nodejs";
export const maxDuration=60;
export async function GET(request:Request){const secret=process.env.CRON_SECRET;const supplied=request.headers.get("authorization");if(!secret||supplied!==`Bearer ${secret}`)return Response.json({error:"Unauthorized"},{status:401});await ensureSchema();const due=await listMonitoredAgents(true,25);const settled=await Promise.allSettled(due.map((agent)=>observeAgent({agentName:agent.agentName,endpointUrl:agent.endpointUrl,expectedStatus:agent.expectedStatus,expectedContentType:agent.expectedContentType,timeoutMs:8000,monitoredAgent:agent})));return Response.json({checked:due.length,succeeded:settled.filter((item)=>item.status==="fulfilled").length,failed:settled.filter((item)=>item.status==="rejected").length,completedAt:new Date().toISOString()});}
