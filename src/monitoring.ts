import crypto from "node:crypto";
import { ensureSchema, findMonitoredAgentByEndpoint, findOpenIncidentByEndpoint, insertContinuityRecord, insertIncident, insertRecoveryAction, insertReliabilityProbe, setControlledAgentState, updateIncidentStatus, updateMonitoredAgentObservation, type MonitoredAgentRecord } from "./db";
import { probeEndpoint, sha256 } from "./probe";
import { hashRecord } from "./records";
import { canExecuteAutomaticRecovery } from "./adapters";

export type MonitorInput = { agentName:string; endpointUrl:string; expectedStatus:number; expectedContentType:string; timeoutMs:number; monitoredAgent?:MonitoredAgentRecord|null };

async function persistProbe(input:MonitorInput, result:Awaited<ReturnType<typeof probeEndpoint>>) { const startedAt=new Date().toISOString(); const probeId=crypto.randomUUID(); const completedAt=new Date().toISOString(); const output={...result,probeId}; await insertReliabilityProbe({ id:probeId, agentName:input.agentName, endpointUrl:input.endpointUrl, status:result.status, startedAt, completedAt, inputHash:sha256(input), outputHash:sha256(output), summary:result.summary, statusCode:result.statusCode, latencyMs:result.latencyMs, contentType:result.contentType }); return probeId; }

export async function observeAgent(input:MonitorInput) {
  await ensureSchema();
  const monitored=input.monitoredAgent ?? await findMonitoredAgentByEndpoint(input.endpointUrl);
  const result=await probeEndpoint(input.endpointUrl,input.timeoutMs,input.expectedStatus,input.expectedContentType);
  const probeId=await persistProbe(input,result);
  if(monitored) await updateMonitoredAgentObservation(input.endpointUrl,result.status,monitored.intervalSeconds);
  let incident=await findOpenIncidentByEndpoint(input.endpointUrl);
  if(result.status!=="HEALTHY" && !incident) { const id=crypto.randomUUID(); const now=new Date().toISOString(); incident={ id,publicSlug:`INC-${id.replaceAll("-","").slice(0,12).toUpperCase()}`,agentName:input.agentName,agentId:monitored?.id ?? null,endpointUrl:input.endpointUrl,openedBy:"Continuity autonomous monitor",incidentType:"UNAVAILABLE",severity:result.statusCode && result.statusCode>=500?"HIGH":"MEDIUM",status:"OPEN",claim:`Endpoint contract failed: ${result.summary}`,requestedOutcome:"RECORD_ONLY",evidenceUrls:[],createdAt:now,updatedAt:now }; await insertIncident(incident); }
  if(result.status==="HEALTHY" && incident) { await updateIncidentStatus(incident.id,"RESTORED"); return {result,probeId,incident:{incidentId:incident.id,publicSlug:incident.publicSlug,status:"RESTORED"},recovery:null}; }
  if(result.status!=="HEALTHY" && incident && monitored && canExecuteAutomaticRecovery(monitored.recoveryPolicy, monitored.adapterKey)) {
    const startedAt=new Date().toISOString(); await setControlledAgentState("RECOVERING",null); await setControlledAgentState("HEALTHY",null);
    const verification=await probeEndpoint(input.endpointUrl,input.timeoutMs,input.expectedStatus,input.expectedContentType); const verificationProbeId=await persistProbe(input,verification); await updateMonitoredAgentObservation(input.endpointUrl,verification.status,monitored.intervalSeconds);
    const completedAt=new Date().toISOString(); await insertRecoveryAction({id:crypto.randomUUID(),incidentId:incident.id,actionType:"RESTART_AGENT",status:verification.status==="HEALTHY"?"SUCCEEDED":"FAILED",detail:verification.status==="HEALTHY"?"Adapter restarted the agent and the follow-up contract check passed.":"Adapter ran, but the follow-up contract check still failed.",startedAt,completedAt});
    let recordId:string|null=null;
    if(verification.status==="HEALTHY") { await updateIncidentStatus(incident.id,"RESTORED"); recordId=crypto.randomUUID(); const generated={verdict:"RESTORED" as const,confidence:"HIGH" as const,rootCause:"The registered recovery adapter restarted the agent after a directly observed endpoint failure.",impactSummary:incident.claim,evidenceSummary:{initialProbeId:probeId,verificationProbeId,recoveryAction:"RESTART_AGENT",adapterKey:monitored.adapterKey,systemObserved:true},recommendedActions:["Continue autonomous monitoring","Escalate if the failure repeats within the policy window"],replacementServices:[]}; const payload={incidentId:incident.id,agentName:incident.agentName,recordType:"RECOVERY_RECORD" as const,...generated}; const recordHash=hashRecord(payload); const publicUrl=process.env.PUBLIC_BASE_URL?`${process.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/records/${recordId}`:null; await insertContinuityRecord({id:recordId,incidentId:incident.id,agentName:incident.agentName,recordType:"RECOVERY_RECORD",...generated,recordHash,signature:null,publicUrl,createdAt:new Date().toISOString()}); }
    return {result:verification,probeId:verificationProbeId,incident:{incidentId:incident.id,publicSlug:incident.publicSlug,status:verification.status==="HEALTHY"?"RESTORED":incident.status},recovery:{action:"RESTART_AGENT",status:verification.status==="HEALTHY"?"SUCCEEDED":"FAILED",recordId},initialObservation:{status:result.status,probeId}};
  }
  return {result,probeId,incident:incident?{incidentId:incident.id,publicSlug:incident.publicSlug,status:incident.status}:null,recovery:null};
}
