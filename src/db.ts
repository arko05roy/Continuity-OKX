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
    created_at TIMESTAMPTZ NOT NULL
  )`;
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
}

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
  reviewStatus: string; createdAt: string;
}) {
  const sql = database();
  await sql`INSERT INTO evidence_submissions (
    id, task_id, incident_id, submitted_by_wallet, evidence_type, content_uri,
    content_hash, statement, statement_hash, signature, signed_at, signature_valid,
    content_hash_matched, review_status, created_at
  ) VALUES (
    ${submission.id}, ${submission.taskId}, ${submission.incidentId}, ${submission.submittedByWallet},
    ${submission.evidenceType}, ${submission.contentUri}, ${submission.contentHash},
    ${submission.statement}, ${submission.statementHash}, ${submission.signature}, ${submission.signedAt},
    ${submission.signatureValid}, ${submission.contentHashMatched}, ${submission.reviewStatus}, ${submission.createdAt}
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
  createdAt: string;
};

export async function findEvidenceSubmissions(incidentId: string): Promise<EvidenceSubmissionRecord[]> {
  const sql = database();
  const rows = await sql`SELECT id, incident_id, submitted_by_wallet, evidence_type,
    content_uri, content_hash, statement, signature, signed_at, signature_valid,
    content_hash_matched, review_status, created_at
    FROM evidence_submissions WHERE incident_id = ${incidentId} ORDER BY created_at ASC`;
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id), incidentId: String(value.incident_id), submittedByWallet: String(value.submitted_by_wallet),
      evidenceType: String(value.evidence_type), contentUri: value.content_uri === null ? null : String(value.content_uri),
      contentHash: String(value.content_hash), statement: String(value.statement), signature: String(value.signature),
      signedAt: new Date(String(value.signed_at)).toISOString(), signatureValid: Boolean(value.signature_valid),
      contentHashMatched: value.content_hash_matched === null ? null : Boolean(value.content_hash_matched),
      reviewStatus: String(value.review_status), createdAt: new Date(String(value.created_at)).toISOString(),
    };
  });
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
