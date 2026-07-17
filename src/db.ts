import { neon } from "@neondatabase/serverless";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return neon(url);
}

export async function ensureSchema() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS reliability_probes (
    id UUID PRIMARY KEY, agent_name TEXT NOT NULL, endpoint_url TEXT NOT NULL,
    probe_type TEXT NOT NULL, status TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL, input_hash TEXT NOT NULL, output_hash TEXT NOT NULL,
    summary TEXT NOT NULL, http_status_code INTEGER, latency_ms INTEGER, content_type TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY,
    public_slug TEXT NOT NULL UNIQUE,
    agent_name TEXT NOT NULL,
    agent_id TEXT,
    endpoint_url TEXT,
    opened_by TEXT NOT NULL,
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    claim TEXT NOT NULL,
    requested_outcome TEXT NOT NULL,
    evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS human_evidence_tasks (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    task_type TEXT NOT NULL,
    instructions TEXT NOT NULL,
    reward_amount NUMERIC(30, 18) NOT NULL,
    reward_token TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    assigned_to_wallet TEXT,
    assignment_status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS evidence_submissions (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES human_evidence_tasks(id),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    submitted_by_wallet TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    content_uri TEXT,
    content_hash TEXT NOT NULL,
    statement TEXT NOT NULL,
    statement_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    content_hash_matched BOOLEAN,
    review_status TEXT NOT NULL,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`ALTER TABLE evidence_submissions ADD COLUMN IF NOT EXISTS reviewer_notes TEXT`;
  await sql`ALTER TABLE evidence_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS continuity_records (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    agent_name TEXT NOT NULL,
    record_type TEXT NOT NULL,
    verdict TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'LOW',
    root_cause TEXT NOT NULL,
    impact_summary TEXT NOT NULL,
    evidence_summary JSONB NOT NULL,
    recommended_actions JSONB NOT NULL,
    replacement_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    record_hash TEXT NOT NULL UNIQUE,
    signature TEXT,
    public_url TEXT,
    created_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`ALTER TABLE continuity_records ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'LOW'`;
  await sql`CREATE TABLE IF NOT EXISTS controlled_agent_runtime (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    failure_mode TEXT,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`INSERT INTO controlled_agent_runtime (id, state, failure_mode, updated_at)
    VALUES ('research-coordinator', 'HEALTHY', NULL, NOW())
    ON CONFLICT (id) DO NOTHING`;
  await sql`CREATE TABLE IF NOT EXISTS monitored_agents (
    id UUID PRIMARY KEY,
    agent_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL UNIQUE,
    expected_status INTEGER NOT NULL DEFAULT 200,
    expected_content_type TEXT NOT NULL DEFAULT 'application/json',
    interval_seconds INTEGER NOT NULL DEFAULT 60,
    recovery_policy TEXT NOT NULL DEFAULT 'RETRY_AND_ESCALATE',
    adapter_key TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    latest_status TEXT NOT NULL DEFAULT 'PENDING',
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS recovery_actions (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    action_type TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ
  )`;
  await sql`ALTER TABLE monitored_agents ADD COLUMN IF NOT EXISTS recovery_policy TEXT NOT NULL DEFAULT 'RETRY_AND_ESCALATE'`;
  await sql`ALTER TABLE monitored_agents ADD COLUMN IF NOT EXISTS adapter_key TEXT`;
  await sql`ALTER TABLE monitored_agents ADD COLUMN IF NOT EXISTS latest_status TEXT NOT NULL DEFAULT 'PENDING'`;
  await sql`ALTER TABLE monitored_agents ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE monitored_agents ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS a2a_investigations (
    id UUID PRIMARY KEY,
    public_slug TEXT NOT NULL UNIQUE,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    agent_name TEXT NOT NULL,
    agent_id TEXT,
    endpoint_url TEXT,
    opened_by TEXT NOT NULL,
    claim TEXT NOT NULL,
    requested_outcome TEXT NOT NULL,
    budget_amount NUMERIC(30, 18) NOT NULL,
    budget_token TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    delivery_instructions TEXT NOT NULL,
    status TEXT NOT NULL,
    quoted_amount NUMERIC(30, 18),
    quoted_token TEXT,
    quoted_scope TEXT,
    quote_expires_at TIMESTAMPTZ,
    payment_status TEXT NOT NULL,
    payment_reference TEXT,
    payment_network TEXT,
    record_id UUID REFERENCES continuity_records(id),
    delivery_url TEXT,
    buyer_decision TEXT,
    buyer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
}

export type ControlledAgentState = { state: "HEALTHY" | "FAILED" | "RECOVERING"; failureMode: string | null; updatedAt: string };

export async function getControlledAgentState(): Promise<ControlledAgentState> {
  const sql = database();
  const rows = await sql`SELECT state, failure_mode, updated_at FROM controlled_agent_runtime WHERE id = 'research-coordinator' LIMIT 1`;
  if (!rows.length) return { state: "HEALTHY", failureMode: null, updatedAt: new Date().toISOString() };
  const row = rows[0] as Record<string, unknown>;
  return { state: String(row.state) as ControlledAgentState["state"], failureMode: row.failure_mode === null ? null : String(row.failure_mode), updatedAt: new Date(String(row.updated_at)).toISOString() };
}

export async function setControlledAgentState(state: ControlledAgentState["state"], failureMode: string | null): Promise<ControlledAgentState> {
  const sql = database(); const updatedAt = new Date().toISOString();
  await sql`INSERT INTO controlled_agent_runtime (id, state, failure_mode, updated_at)
    VALUES ('research-coordinator', ${state}, ${failureMode}, ${updatedAt})
    ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, failure_mode = EXCLUDED.failure_mode, updated_at = EXCLUDED.updated_at`;
  return { state, failureMode, updatedAt };
}

export type MonitoredAgentRecord = { id: string; agentName: string; endpointUrl: string; expectedStatus: number; expectedContentType: string; intervalSeconds: number; recoveryPolicy: string; adapterKey: string | null; enabled: boolean; latestStatus: string; consecutiveFailures: number; lastCheckedAt: string | null; nextCheckAt: string; createdAt: string; updatedAt: string };

function mapMonitoredAgent(row: Record<string, unknown>): MonitoredAgentRecord { return { id:String(row.id), agentName:String(row.agent_name), endpointUrl:String(row.endpoint_url), expectedStatus:Number(row.expected_status), expectedContentType:String(row.expected_content_type), intervalSeconds:Number(row.interval_seconds), recoveryPolicy:String(row.recovery_policy), adapterKey:row.adapter_key === null ? null : String(row.adapter_key), enabled:Boolean(row.enabled), latestStatus:String(row.latest_status), consecutiveFailures:Number(row.consecutive_failures), lastCheckedAt:row.last_checked_at ? new Date(String(row.last_checked_at)).toISOString() : null, nextCheckAt:new Date(String(row.next_check_at)).toISOString(), createdAt:new Date(String(row.created_at)).toISOString(), updatedAt:new Date(String(row.updated_at)).toISOString() }; }

export async function upsertMonitoredAgent(agent: { id: string; agentName: string; endpointUrl: string; expectedStatus: number; expectedContentType: string; intervalSeconds: number; recoveryPolicy: string; adapterKey: string | null }): Promise<MonitoredAgentRecord> {
  const sql = database(); const now = new Date().toISOString();
  const rows = await sql`INSERT INTO monitored_agents (id, agent_name, endpoint_url, expected_status, expected_content_type, interval_seconds, recovery_policy, adapter_key, enabled, latest_status, consecutive_failures, next_check_at, created_at, updated_at)
    VALUES (${agent.id}, ${agent.agentName}, ${agent.endpointUrl}, ${agent.expectedStatus}, ${agent.expectedContentType}, ${agent.intervalSeconds}, ${agent.recoveryPolicy}, ${agent.adapterKey}, TRUE, 'PENDING', 0, ${now}, ${now}, ${now})
    ON CONFLICT (endpoint_url) DO UPDATE SET agent_name=EXCLUDED.agent_name, expected_status=EXCLUDED.expected_status, expected_content_type=EXCLUDED.expected_content_type, interval_seconds=EXCLUDED.interval_seconds, recovery_policy=EXCLUDED.recovery_policy, adapter_key=COALESCE(monitored_agents.adapter_key, EXCLUDED.adapter_key), enabled=TRUE, updated_at=EXCLUDED.updated_at
    RETURNING *`;
  return mapMonitoredAgent(rows[0] as Record<string, unknown>);
}

export async function listMonitoredAgents(dueOnly = false, limit = 100): Promise<MonitoredAgentRecord[]> {
  const sql = database();
  const rows = dueOnly ? await sql`SELECT * FROM monitored_agents WHERE enabled=TRUE AND next_check_at <= NOW() ORDER BY next_check_at ASC LIMIT ${limit}` : await sql`SELECT * FROM monitored_agents ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((row) => mapMonitoredAgent(row as Record<string, unknown>));
}
export async function findMonitoredAgentByEndpoint(endpointUrl:string):Promise<MonitoredAgentRecord|null> { const sql=database(); const rows=await sql`SELECT * FROM monitored_agents WHERE endpoint_url=${endpointUrl} LIMIT 1`; return rows.length ? mapMonitoredAgent(rows[0] as Record<string,unknown>) : null; }

export async function updateMonitoredAgentObservation(endpointUrl: string, status: string, intervalSeconds: number) {
  const sql = database(); const now = new Date(); const next = new Date(now.getTime() + intervalSeconds * 1000).toISOString();
  await sql`UPDATE monitored_agents SET latest_status=${status}, consecutive_failures=CASE WHEN ${status}='HEALTHY' THEN 0 ELSE consecutive_failures+1 END, last_checked_at=${now.toISOString()}, next_check_at=${next}, updated_at=${now.toISOString()} WHERE endpoint_url=${endpointUrl}`;
}

export type RecoveryActionRecord = { id:string; incidentId:string; actionType:string; status:string; detail:string; startedAt:string; completedAt:string | null };
export async function insertRecoveryAction(action: RecoveryActionRecord) { const sql=database(); await sql`INSERT INTO recovery_actions (id, incident_id, action_type, status, detail, started_at, completed_at) VALUES (${action.id},${action.incidentId},${action.actionType},${action.status},${action.detail},${action.startedAt},${action.completedAt})`; }
export async function listRecoveryActions(incidentId:string):Promise<RecoveryActionRecord[]> { const sql=database(); const rows=await sql`SELECT * FROM recovery_actions WHERE incident_id=${incidentId} ORDER BY started_at ASC`; return rows.map((row) => { const value=row as Record<string,unknown>; return { id:String(value.id), incidentId:String(value.incident_id), actionType:String(value.action_type), status:String(value.status), detail:String(value.detail), startedAt:new Date(String(value.started_at)).toISOString(), completedAt:value.completed_at ? new Date(String(value.completed_at)).toISOString() : null }; }); }

export async function insertReliabilityProbe(probe: {
  id: string; agentName: string; endpointUrl: string; status: string; startedAt: string;
  completedAt: string; inputHash: string; outputHash: string; summary: string;
  statusCode: number | null; latencyMs: number | null; contentType: string | null;
}) {
  const sql = database();
  await sql`INSERT INTO reliability_probes (
    id, agent_name, endpoint_url, probe_type, status, started_at, completed_at,
    input_hash, output_hash, summary, http_status_code, latency_ms, content_type
  ) VALUES (
    ${probe.id}, ${probe.agentName}, ${probe.endpointUrl}, 'UPTIME', ${probe.status},
    ${probe.startedAt}, ${probe.completedAt}, ${probe.inputHash}, ${probe.outputHash},
    ${probe.summary}, ${probe.statusCode}, ${probe.latencyMs}, ${probe.contentType}
  )`;
}

export type IncidentRecord = {
  id: string;
  publicSlug: string;
  agentName: string;
  agentId: string | null;
  endpointUrl: string | null;
  openedBy: string;
  incidentType: string;
  severity: string;
  status: string;
  claim: string;
  requestedOutcome: string;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
};

function mapIncident(row: Record<string, unknown>): IncidentRecord {
  return {
    id: String(row.id),
    publicSlug: String(row.public_slug),
    agentName: String(row.agent_name),
    agentId: row.agent_id === null ? null : String(row.agent_id),
    endpointUrl: row.endpoint_url === null ? null : String(row.endpoint_url),
    openedBy: String(row.opened_by),
    incidentType: String(row.incident_type),
    severity: String(row.severity),
    status: String(row.status),
    claim: String(row.claim),
    requestedOutcome: String(row.requested_outcome),
    evidenceUrls: Array.isArray(row.evidence_urls) ? row.evidence_urls.map(String) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertIncident(incident: IncidentRecord) {
  const sql = database();
  await sql`INSERT INTO incidents (
    id, public_slug, agent_name, agent_id, endpoint_url, opened_by,
    incident_type, severity, status, claim, requested_outcome,
    evidence_urls, created_at, updated_at
  ) VALUES (
    ${incident.id}, ${incident.publicSlug}, ${incident.agentName}, ${incident.agentId},
    ${incident.endpointUrl}, ${incident.openedBy}, ${incident.incidentType},
    ${incident.severity}, ${incident.status}, ${incident.claim},
    ${incident.requestedOutcome}, ${JSON.stringify(incident.evidenceUrls)}::jsonb,
    ${incident.createdAt}, ${incident.updatedAt}
  )`;
}

export async function findIncident(idOrSlug: string): Promise<IncidentRecord | null> {
  const sql = database();
  const rows = await sql`SELECT
    id, public_slug, agent_name, agent_id, endpoint_url, opened_by,
    incident_type, severity, status, claim, requested_outcome,
    evidence_urls, created_at, updated_at
    FROM incidents
    WHERE id::text = ${idOrSlug} OR public_slug = ${idOrSlug}
    LIMIT 1`;
  return rows.length === 0 ? null : mapIncident(rows[0] as Record<string, unknown>);
}

export async function listIncidents(limit = 50): Promise<IncidentRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, public_slug, agent_name, agent_id, endpoint_url, opened_by,
    incident_type, severity, status, claim, requested_outcome, evidence_urls, created_at, updated_at
    FROM incidents ORDER BY updated_at DESC LIMIT ${limit}`;
  return rows.map((row) => mapIncident(row as Record<string, unknown>));
}

export async function findOpenIncidentByEndpoint(endpointUrl: string): Promise<IncidentRecord | null> {
  const sql = database();
  const rows = await sql`SELECT id, public_slug, agent_name, agent_id, endpoint_url, opened_by,
    incident_type, severity, status, claim, requested_outcome, evidence_urls, created_at, updated_at
    FROM incidents WHERE endpoint_url = ${endpointUrl} AND status NOT IN ('RESOLVED', 'RESTORED')
    ORDER BY updated_at DESC LIMIT 1`;
  return rows.length === 0 ? null : mapIncident(rows[0] as Record<string, unknown>);
}

export async function updateIncidentStatus(id: string, status: "OPEN" | "INVESTIGATING" | "RESTORED" | "RESOLVED") {
  const sql = database();
  await sql`UPDATE incidents SET status = ${status}, updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export type ReliabilityProbeRecord = {
  id: string;
  agentName: string;
  endpointUrl: string;
  probeType: string;
  status: string;
  startedAt: string;
  completedAt: string;
  summary: string;
  statusCode: number | null;
  latencyMs: number | null;
  contentType: string | null;
};

export async function listReliabilityProbes(limit = 50): Promise<ReliabilityProbeRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, agent_name, endpoint_url, probe_type, status, started_at,
    completed_at, summary, http_status_code, latency_ms, content_type
    FROM reliability_probes ORDER BY completed_at DESC LIMIT ${limit}`;
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id), agentName: String(value.agent_name), endpointUrl: String(value.endpoint_url),
      probeType: String(value.probe_type), status: String(value.status), startedAt: new Date(String(value.started_at)).toISOString(),
      completedAt: new Date(String(value.completed_at)).toISOString(), summary: String(value.summary),
      statusCode: value.http_status_code === null ? null : Number(value.http_status_code),
      latencyMs: value.latency_ms === null ? null : Number(value.latency_ms),
      contentType: value.content_type === null ? null : String(value.content_type),
    };
  });
}

export type EvidenceTaskRecord = {
  id: string;
  incidentId: string;
  taskType: string;
  instructions: string;
  rewardAmount: string;
  rewardToken: string;
  deadline: string;
  assignedToWallet: string | null;
  assignmentStatus: string;
  createdAt: string;
  updatedAt: string;
};

export async function insertEvidenceTask(task: EvidenceTaskRecord) {
  const sql = database();
  await sql`INSERT INTO human_evidence_tasks (
    id, incident_id, task_type, instructions, reward_amount, reward_token,
    deadline, assigned_to_wallet, assignment_status, created_at, updated_at
  ) VALUES (
    ${task.id}, ${task.incidentId}, ${task.taskType}, ${task.instructions},
    ${task.rewardAmount}, ${task.rewardToken}, ${task.deadline},
    ${task.assignedToWallet}, ${task.assignmentStatus}, ${task.createdAt}, ${task.updatedAt}
  )`;
}

export async function findEvidenceTask(id: string): Promise<EvidenceTaskRecord | null> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, task_type, instructions, reward_amount,
    reward_token, deadline, assigned_to_wallet, assignment_status, created_at, updated_at
    FROM human_evidence_tasks WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return {
    id: String(row.id), incidentId: String(row.incident_id), taskType: String(row.task_type),
    instructions: String(row.instructions), rewardAmount: String(row.reward_amount),
    rewardToken: String(row.reward_token), deadline: new Date(String(row.deadline)).toISOString(),
    assignedToWallet: row.assigned_to_wallet === null ? null : String(row.assigned_to_wallet),
    assignmentStatus: String(row.assignment_status), createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listEvidenceTasks(limit = 50): Promise<EvidenceTaskRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, task_type, instructions, reward_amount,
    reward_token, deadline, assigned_to_wallet, assignment_status, created_at, updated_at
    FROM human_evidence_tasks ORDER BY updated_at DESC LIMIT ${limit}`;
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id), incidentId: String(value.incident_id), taskType: String(value.task_type),
      instructions: String(value.instructions), rewardAmount: String(value.reward_amount), rewardToken: String(value.reward_token),
      deadline: new Date(String(value.deadline)).toISOString(), assignedToWallet: value.assigned_to_wallet === null ? null : String(value.assigned_to_wallet),
      assignmentStatus: String(value.assignment_status), createdAt: new Date(String(value.created_at)).toISOString(),
      updatedAt: new Date(String(value.updated_at)).toISOString(),
    };
  });
}

export async function insertEvidenceSubmission(submission: {
  id: string; taskId: string; incidentId: string; submittedByWallet: string; evidenceType: string;
  contentUri: string | null; contentHash: string; statement: string; statementHash: string;
  signature: string; signedAt: string; signatureValid: boolean; contentHashMatched: boolean | null;
  reviewStatus: string; reviewerNotes?: string | null; reviewedAt?: string | null; createdAt: string;
}) {
  const sql = database();
  await sql`INSERT INTO evidence_submissions (
    id, task_id, incident_id, submitted_by_wallet, evidence_type, content_uri,
    content_hash, statement, statement_hash, signature, signed_at, signature_valid,
    content_hash_matched, review_status, reviewer_notes, reviewed_at, created_at
  ) VALUES (
    ${submission.id}, ${submission.taskId}, ${submission.incidentId}, ${submission.submittedByWallet},
    ${submission.evidenceType}, ${submission.contentUri}, ${submission.contentHash},
    ${submission.statement}, ${submission.statementHash}, ${submission.signature}, ${submission.signedAt},
    ${submission.signatureValid}, ${submission.contentHashMatched}, ${submission.reviewStatus},
    ${submission.reviewerNotes ?? null}, ${submission.reviewedAt ?? null}, ${submission.createdAt}
  )`;
}

export type EvidenceSubmissionRecord = {
  id: string;
  incidentId: string;
  submittedByWallet: string;
  evidenceType: string;
  contentUri: string | null;
  contentHash: string;
  statement: string;
  signature: string;
  signedAt: string;
  signatureValid: boolean;
  contentHashMatched: boolean | null;
  reviewStatus: string;
  reviewerNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

export async function findEvidenceSubmissions(incidentId: string): Promise<EvidenceSubmissionRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, submitted_by_wallet, evidence_type,
    content_uri, content_hash, statement, signature, signed_at, signature_valid,
    content_hash_matched, review_status, reviewer_notes, reviewed_at, created_at
    FROM evidence_submissions WHERE incident_id = ${incidentId} ORDER BY created_at ASC`;
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id), incidentId: String(value.incident_id), submittedByWallet: String(value.submitted_by_wallet),
      evidenceType: String(value.evidence_type), contentUri: value.content_uri === null ? null : String(value.content_uri),
      contentHash: String(value.content_hash), statement: String(value.statement), signature: String(value.signature),
      signedAt: new Date(String(value.signed_at)).toISOString(), signatureValid: Boolean(value.signature_valid),
      contentHashMatched: value.content_hash_matched === null ? null : Boolean(value.content_hash_matched),
      reviewStatus: String(value.review_status), reviewerNotes: value.reviewer_notes === null ? null : String(value.reviewer_notes),
      reviewedAt: value.reviewed_at ? new Date(String(value.reviewed_at)).toISOString() : null,
      createdAt: new Date(String(value.created_at)).toISOString(),
    };
  });
}

export async function findEvidenceSubmission(id: string): Promise<EvidenceSubmissionRecord | null> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, submitted_by_wallet, evidence_type, content_uri, content_hash,
    statement, signature, signed_at, signature_valid, content_hash_matched, review_status, reviewer_notes,
    reviewed_at, created_at FROM evidence_submissions WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const value = rows[0] as Record<string, unknown>;
  return {
    id: String(value.id), incidentId: String(value.incident_id), submittedByWallet: String(value.submitted_by_wallet),
    evidenceType: String(value.evidence_type), contentUri: value.content_uri === null ? null : String(value.content_uri),
    contentHash: String(value.content_hash), statement: String(value.statement), signature: String(value.signature),
    signedAt: new Date(String(value.signed_at)).toISOString(), signatureValid: Boolean(value.signature_valid),
    contentHashMatched: value.content_hash_matched === null ? null : Boolean(value.content_hash_matched), reviewStatus: String(value.review_status),
    reviewerNotes: value.reviewer_notes === null ? null : String(value.reviewer_notes), reviewedAt: value.reviewed_at ? new Date(String(value.reviewed_at)).toISOString() : null,
    createdAt: new Date(String(value.created_at)).toISOString(),
  };
}

export async function listPendingEvidenceSubmissions(limit = 100): Promise<EvidenceSubmissionRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, submitted_by_wallet, evidence_type, content_uri, content_hash,
    statement, signature, signed_at, signature_valid, content_hash_matched, review_status, reviewer_notes,
    reviewed_at, created_at FROM evidence_submissions WHERE review_status = 'PENDING' ORDER BY created_at ASC LIMIT ${limit}`;
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id), incidentId: String(value.incident_id), submittedByWallet: String(value.submitted_by_wallet),
      evidenceType: String(value.evidence_type), contentUri: value.content_uri === null ? null : String(value.content_uri), contentHash: String(value.content_hash),
      statement: String(value.statement), signature: String(value.signature), signedAt: new Date(String(value.signed_at)).toISOString(),
      signatureValid: Boolean(value.signature_valid), contentHashMatched: value.content_hash_matched === null ? null : Boolean(value.content_hash_matched),
      reviewStatus: String(value.review_status), reviewerNotes: value.reviewer_notes === null ? null : String(value.reviewer_notes),
      reviewedAt: value.reviewed_at ? new Date(String(value.reviewed_at)).toISOString() : null, createdAt: new Date(String(value.created_at)).toISOString(),
    };
  });
}

export async function reviewEvidenceSubmission(id: string, decision: "ACCEPTED" | "REJECTED", reviewerNotes: string, reviewedAt: string) {
  const sql = database();
  await sql`UPDATE evidence_submissions SET review_status = ${decision}, reviewer_notes = ${reviewerNotes}, reviewed_at = ${reviewedAt} WHERE id = ${id}`;
}

export type ContinuityRecordRecord = {
  id: string;
  incidentId: string;
  agentName: string;
  recordType: string;
  verdict: string;
  confidence: string;
  rootCause: string;
  impactSummary: string;
  evidenceSummary: Record<string, unknown>;
  recommendedActions: string[];
  replacementServices: string[];
  recordHash: string;
  signature: string | null;
  publicUrl: string | null;
  createdAt: string;
};

function mapContinuityRecord(row: Record<string, unknown>): ContinuityRecordRecord {
  return {
    id: String(row.id), incidentId: String(row.incident_id), agentName: String(row.agent_name),
    recordType: String(row.record_type), verdict: String(row.verdict), confidence: String(row.confidence ?? "LOW"), rootCause: String(row.root_cause),
    impactSummary: String(row.impact_summary), evidenceSummary: (row.evidence_summary ?? {}) as Record<string, unknown>,
    recommendedActions: Array.isArray(row.recommended_actions) ? row.recommended_actions.map(String) : [],
    replacementServices: Array.isArray(row.replacement_services) ? row.replacement_services.map(String) : [],
    recordHash: String(row.record_hash), signature: row.signature === null ? null : String(row.signature),
    publicUrl: row.public_url === null ? null : String(row.public_url), createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function insertContinuityRecord(record: ContinuityRecordRecord) {
  const sql = database();
  await sql`INSERT INTO continuity_records (
    id, incident_id, agent_name, record_type, verdict, confidence, root_cause, impact_summary,
    evidence_summary, recommended_actions, replacement_services, record_hash,
    signature, public_url, created_at
  ) VALUES (
    ${record.id}, ${record.incidentId}, ${record.agentName}, ${record.recordType}, ${record.verdict}, ${record.confidence},
    ${record.rootCause}, ${record.impactSummary}, ${JSON.stringify(record.evidenceSummary)}::jsonb,
    ${JSON.stringify(record.recommendedActions)}::jsonb, ${JSON.stringify(record.replacementServices)}::jsonb,
    ${record.recordHash}, ${record.signature}, ${record.publicUrl}, ${record.createdAt}
  )`;
}

export async function findContinuityRecord(id: string): Promise<ContinuityRecordRecord | null> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, agent_name, record_type, verdict, confidence, root_cause,
    impact_summary, evidence_summary, recommended_actions, replacement_services, record_hash,
    signature, public_url, created_at FROM continuity_records WHERE id = ${id} LIMIT 1`;
  return rows.length === 0 ? null : mapContinuityRecord(rows[0] as Record<string, unknown>);
}

export async function listContinuityRecords(limit = 50): Promise<ContinuityRecordRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, agent_name, record_type, verdict, confidence, root_cause,
    impact_summary, evidence_summary, recommended_actions, replacement_services, record_hash,
    signature, public_url, created_at FROM continuity_records ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((row) => mapContinuityRecord(row as Record<string, unknown>));
}

export type A2AInvestigationRecord = {
  id: string;
  publicSlug: string;
  incidentId: string;
  agentName: string;
  agentId: string | null;
  endpointUrl: string | null;
  openedBy: string;
  claim: string;
  requestedOutcome: string;
  budgetAmount: string;
  budgetToken: string;
  deadline: string;
  deliveryInstructions: string;
  status: string;
  quotedAmount: string | null;
  quotedToken: string | null;
  quotedScope: string | null;
  quoteExpiresAt: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  paymentNetwork: string | null;
  recordId: string | null;
  deliveryUrl: string | null;
  buyerDecision: string | null;
  buyerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function mapA2AInvestigation(row: Record<string, unknown>): A2AInvestigationRecord {
  return {
    id: String(row.id), publicSlug: String(row.public_slug), incidentId: String(row.incident_id),
    agentName: String(row.agent_name), agentId: nullableString(row.agent_id), endpointUrl: nullableString(row.endpoint_url),
    openedBy: String(row.opened_by), claim: String(row.claim), requestedOutcome: String(row.requested_outcome),
    budgetAmount: String(row.budget_amount), budgetToken: String(row.budget_token), deadline: new Date(String(row.deadline)).toISOString(),
    deliveryInstructions: String(row.delivery_instructions), status: String(row.status), quotedAmount: nullableString(row.quoted_amount),
    quotedToken: nullableString(row.quoted_token), quotedScope: nullableString(row.quoted_scope), quoteExpiresAt: row.quote_expires_at ? new Date(String(row.quote_expires_at)).toISOString() : null,
    paymentStatus: String(row.payment_status), paymentReference: nullableString(row.payment_reference), paymentNetwork: nullableString(row.payment_network),
    recordId: nullableString(row.record_id), deliveryUrl: nullableString(row.delivery_url), buyerDecision: nullableString(row.buyer_decision),
    buyerNote: nullableString(row.buyer_note), createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertA2AInvestigation(investigation: A2AInvestigationRecord) {
  const sql = database();
  await sql`INSERT INTO a2a_investigations (
    id, public_slug, incident_id, agent_name, agent_id, endpoint_url, opened_by, claim,
    requested_outcome, budget_amount, budget_token, deadline, delivery_instructions,
    status, quoted_amount, quoted_token, quoted_scope, quote_expires_at, payment_status,
    payment_reference, payment_network, record_id, delivery_url, buyer_decision, buyer_note,
    created_at, updated_at
  ) VALUES (
    ${investigation.id}, ${investigation.publicSlug}, ${investigation.incidentId}, ${investigation.agentName},
    ${investigation.agentId}, ${investigation.endpointUrl}, ${investigation.openedBy}, ${investigation.claim},
    ${investigation.requestedOutcome}, ${investigation.budgetAmount}, ${investigation.budgetToken}, ${investigation.deadline},
    ${investigation.deliveryInstructions}, ${investigation.status}, ${investigation.quotedAmount}, ${investigation.quotedToken},
    ${investigation.quotedScope}, ${investigation.quoteExpiresAt}, ${investigation.paymentStatus}, ${investigation.paymentReference},
    ${investigation.paymentNetwork}, ${investigation.recordId}, ${investigation.deliveryUrl}, ${investigation.buyerDecision},
    ${investigation.buyerNote}, ${investigation.createdAt}, ${investigation.updatedAt}
  )`;
}

export async function findA2AInvestigation(idOrSlug: string): Promise<A2AInvestigationRecord | null> {
  const sql = database();
  const rows = await sql`SELECT id, public_slug, incident_id, agent_name, agent_id, endpoint_url, opened_by, claim,
    requested_outcome, budget_amount, budget_token, deadline, delivery_instructions, status,
    quoted_amount, quoted_token, quoted_scope, quote_expires_at, payment_status, payment_reference,
    payment_network, record_id, delivery_url, buyer_decision, buyer_note, created_at, updated_at
    FROM a2a_investigations WHERE id::text = ${idOrSlug} OR public_slug = ${idOrSlug} LIMIT 1`;
  return rows.length === 0 ? null : mapA2AInvestigation(rows[0] as Record<string, unknown>);
}

export async function updateA2AInvestigation(investigation: A2AInvestigationRecord) {
  const sql = database();
  await sql`UPDATE a2a_investigations SET
    status = ${investigation.status}, quoted_amount = ${investigation.quotedAmount}, quoted_token = ${investigation.quotedToken},
    quoted_scope = ${investigation.quotedScope}, quote_expires_at = ${investigation.quoteExpiresAt}, payment_status = ${investigation.paymentStatus},
    payment_reference = ${investigation.paymentReference}, payment_network = ${investigation.paymentNetwork}, record_id = ${investigation.recordId},
    delivery_url = ${investigation.deliveryUrl}, buyer_decision = ${investigation.buyerDecision}, buyer_note = ${investigation.buyerNote},
    updated_at = ${investigation.updatedAt} WHERE id = ${investigation.id}`;
}
