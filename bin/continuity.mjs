#!/usr/bin/env node

const argv=process.argv.slice(2);const json=argv.includes("--json");const args=argv.filter((value)=>value!=="--json");const base=(process.env.CONTINUITY_URL||"https://continuity-okx.vercel.app").replace(/\/$/,"");
const option=(name,fallback)=>{const index=args.indexOf(`--${name}`);return index>=0?args[index+1]:fallback};
const required=(name)=>{const value=option(name);if(!value)throw new Error(`--${name} is required`);return value};
async function request(path,init){const readOnly=!init?.method||init.method.toUpperCase()==="GET";const attempts=readOnly?3:1;let lastBody=null;for(let attempt=0;attempt<attempts;attempt++){const response=await fetch(`${base}${path}`,init);const body=await response.json().catch(()=>({error:`HTTP ${response.status}`}));if(response.ok)return body;lastBody=body;if(!(response.status>=500&&response.status<=599)||attempt===attempts-1)throw new Error(body.error||`HTTP ${response.status}`);await new Promise((resolve)=>setTimeout(resolve,250*(attempt+1)));}throw new Error(lastBody?.error||"Request failed");}
const print=(value)=>{if(json)return console.log(JSON.stringify(value));console.log(JSON.stringify(value,null,2));};
const help=()=>console.log(`Continuity CLI

Usage:
  continuity capabilities
  continuity agents list
  continuity agents add --name <name> --url <https-url> [--interval 60] [--policy RETRY_AND_ESCALATE]
  continuity check --name <name> --url <https-url>
  continuity incidents list
  continuity records list
  continuity a2a open --name <agent> --claim <text> --instructions <text> [--budget 1]
  continuity worker run

Environment:
  CONTINUITY_URL  API origin (default: https://continuity-okx.vercel.app)
  Add --json for machine-readable single-line output.`);

try{
  const [group,command]=args;
  if(!group||group==="help"||group==="--help"){help();process.exit(0);}
  if(group==="capabilities")print(await request("/api/v1/capabilities"));
  else if(group==="agents"&&command==="list")print(await request("/api/v1/agents"));
  else if(group==="agents"&&command==="add")print(await request("/api/v1/agents",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({agentName:required("name"),endpointUrl:required("url"),expectedStatus:Number(option("status","200")),expectedContentType:option("content-type","application/json"),intervalSeconds:Number(option("interval","60")),recoveryPolicy:option("policy","RETRY_AND_ESCALATE")})}));
  else if(group==="check")print(await request("/api/v1/check-agent-status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({agentName:required("name"),endpointUrl:required("url"),expectedStatus:Number(option("status","200")),expectedContentType:option("content-type","application/json"),timeoutMs:Number(option("timeout","8000"))})}));
  else if(group==="incidents"&&command==="list")print(await request("/api/v1/incidents"));
  else if(group==="records"&&command==="list")print(await request("/api/v1/records"));
  else if(group==="worker"&&command==="run"){const secret=process.env.CRON_SECRET;if(!secret)throw new Error("CRON_SECRET is required");print(await request("/api/cron/monitor",{headers:{authorization:`Bearer ${secret}`}}));}
  else if(group==="a2a"&&command==="open")print(await request("/api/v1/a2a/investigations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({agentName:required("name"),endpointUrl:option("url"),openedBy:option("opened-by","autonomous-agent"),incidentType:option("type","RECOVERY_REQUEST"),severity:option("severity","MEDIUM"),claim:required("claim"),requestedOutcome:option("outcome","RECORD_ONLY"),evidenceUrls:[],budgetAmount:option("budget","1"),budgetToken:option("token","USDT0"),deadlineMinutes:Number(option("deadline","120")),deliveryInstructions:required("instructions")})}));
  else{help();process.exitCode=1;}
}catch(error){console.error(json?JSON.stringify({error:error.message}):`Continuity: ${error.message}`);process.exitCode=1;}
