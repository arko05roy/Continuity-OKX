"use client";

import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  agents: { agentName: string; endpointUrl: string; latestStatus: string; lastCheckedAt: string }[];
  incidents: { id: string; publicSlug: string; agentName: string; incidentType: string; severity: string; status: string; claim: string; updatedAt: string }[];
  evidenceTasks: { id: string; incidentId: string; taskType: string; assignmentStatus: string; deadline: string }[];
  records: { id: string; agentName: string; recordType: string; verdict: string; confidence: string; recordHash: string; createdAt: string }[];
  counts: { agents: number; openIncidents: number; evidenceTasks: number; records: number };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatSyncTime(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(value) : "Awaiting first sync";
}

function StatusDot({ status }: { status: string }) {
  return <span className={`status-dot status-${status.toLowerCase()}`} aria-label={status} />;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-mark">∿</span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard data could not be retrieved.");
      const payload = await response.json() as { data: DashboardData };
      setData(payload.data);
      setLastUpdated(new Date());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard data could not be retrieved.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const syncState = error ? "SYNC INTERRUPTED" : data ? "LIVE RECORDS" : "CONNECTING";
  const syncDetail = error ? "Dashboard unavailable" : data ? `Synced ${formatSyncTime(lastUpdated)}` : "Loading persisted data";

  return <main className="continuity-shell">
    <aside className="rail">
      <a className="brand" href="#overview" aria-label="Continuity overview"><span className="brand-mark">C</span><span><strong>Continuity</strong><small>Agent production safety</small></span></a>
      <div className="rail-rule" />
      <nav aria-label="Primary navigation">
        <a className="active" href="#overview"><span>01</span> Command center</a>
        <a href="#agents"><span>02</span> Agent registry</a>
        <a href="#incidents"><span>03</span> Incidents</a>
        <a href="#evidence"><span>04</span> Evidence queue</a>
        <a href="#records"><span>05</span> Records</a>
      </nav>
      <div className="rail-footer">
        <div className="rail-status"><span className={`live-indicator${error ? " is-error" : ""}`} /><strong>{syncState}</strong></div>
        <small>{syncDetail}</small>
        <code>/api/v1/dashboard</code>
      </div>
    </aside>

    <section className="workspace" id="overview">
      <header className="commandbar">
        <div><p className="eyebrow">Continuity / operations</p><p className="command-caption">Observe the slip. Preserve the evidence. Direct the recovery.</p></div>
        <button className="refresh" onClick={() => void loadDashboard()} disabled={loading}><span className="refresh-mark">↻</span>{loading ? "Syncing records" : "Refresh records"}</button>
      </header>

      {error ? <div className="error-banner" role="alert"><div><strong>Data unavailable</strong><span>{error} Check the database connection and try again.</span></div><button onClick={() => void loadDashboard()}>Retry sync</button></div> : null}

      <div className="content">
        <section className="signal-stage">
          <div className="signal-copy"><p className="eyebrow">Agent production control room</p><h1>Make every agent failure <em>legible.</em></h1><p>Continuity turns a live signal, a signed observation, and a recovery record into one operational trail—without inventing what the evidence cannot prove.</p><div className="signal-actions"><a href="#agents">Inspect registry <span>↘</span></a><a href="#records">View records <span>↘</span></a></div></div>
          <div className="continuity-orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-ring ring-three" /><span className="orbit-core">C</span><div className="orbit-key"><span>OBSERVE</span><span>VERIFY</span><span>RECORD</span></div></div>
          <div className="signal-readout"><span>Continuity line</span><div><b>{data?.counts.agents ?? "—"}</b><small>agents observed</small></div><div><b>{data?.counts.records ?? "—"}</b><small>records issued</small></div></div>
        </section>

        <section className="continuity-flow" aria-label="Continuity workflow"><article><span>01</span><div><strong>Observe</strong><p>Real HTTPS probes surface the state an agent actually returns.</p></div><b>{data?.counts.agents ?? "—"}</b></article><article><span>02</span><div><strong>Verify</strong><p>Signed observations wait for explicit review before they count.</p></div><b>{data?.counts.evidenceTasks ?? "—"}</b></article><article><span>03</span><div><strong>Record</strong><p>Persisted evidence becomes a confidence-scored continuity record.</p></div><b>{data?.counts.records ?? "—"}</b></article></section>

        <section className="metric-grid" aria-label="System totals">
          <article className="metric"><span>Observed agents</span><strong>{data?.counts.agents ?? "—"}</strong><small>From live probes and incidents</small></article>
          <article className="metric incident-metric"><span>Open incidents</span><strong>{data?.counts.openIncidents ?? "—"}</strong><small>Cases requiring attention</small></article>
          <article className="metric"><span>Evidence queue</span><strong>{data?.counts.evidenceTasks ?? "—"}</strong><small>Tasks open or under review</small></article>
          <article className="metric"><span>Continuity records</span><strong>{data?.counts.records ?? "—"}</strong><small>Persisted public outputs</small></article>
        </section>

        <div className="section-heading" id="agents"><div><p className="eyebrow">Live registry</p><h2>Agents under observation</h2></div><span className="section-note">{data?.agents.length ?? 0} observed</span></div>
        <section className="agent-grid">{data?.agents.length ? data.agents.map((agent) => <article className="agent-row" key={`${agent.agentName}-${agent.endpointUrl}`}><div className="agent-identity"><StatusDot status={agent.latestStatus} /><div><strong>{agent.agentName}</strong><small>{agent.endpointUrl || "No probe endpoint declared"}</small></div></div><div className="agent-status"><span>{agent.latestStatus}</span><small>{formatDate(agent.lastCheckedAt)}</small></div></article>) : <EmptyState title="No agents observed" detail="Run a real HTTPS status check to create the first verified registry entry." />}</section>

        <div className="split-grid">
          <section className="panel" id="incidents"><div className="panel-heading"><div><p className="eyebrow">Cases</p><h2>Open incidents</h2></div><span className="count-badge">{data?.counts.openIncidents ?? 0}</span></div>{data?.incidents.length ? <div className="table-wrap"><table><thead><tr><th>Incident</th><th>Agent</th><th>Severity</th><th>Status</th><th>Updated</th></tr></thead><tbody>{data.incidents.map((incident) => <tr key={incident.id}><td><strong>{incident.publicSlug}</strong><small>{incident.claim}</small></td><td>{incident.agentName}</td><td><span className={`severity severity-${incident.severity.toLowerCase()}`}>{incident.severity}</span></td><td>{incident.status}</td><td>{formatDate(incident.updatedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No incidents recorded" detail="Caller-submitted incidents will appear here with their current review state." />}</section>
          <section className="panel" id="evidence"><div className="panel-heading"><div><p className="eyebrow">Verification</p><h2>Evidence queue</h2></div><span className="count-badge">{data?.counts.evidenceTasks ?? 0}</span></div>{data?.evidenceTasks.length ? <div className="task-list">{data.evidenceTasks.map((task) => <div className="task-row" key={task.id}><div><strong>{task.taskType.replaceAll("_", " ")}</strong><small>{task.id}</small></div><span className="task-status">{task.assignmentStatus}</span><time>{formatDate(task.deadline)}</time></div>)}</div> : <EmptyState title="Evidence queue is clear" detail="No human verification tasks have been created yet." />}</section>
        </div>

        <section className="panel records-panel" id="records"><div className="panel-heading"><div><p className="eyebrow">Public output</p><h2>Continuity records</h2></div><span className="section-note">Hashes are verifiable</span></div>{data?.records.length ? <div className="record-list">{data.records.map((record) => <a className="record-row" href={`/records/${record.id}`} key={record.id}><div className="record-id"><span className="record-icon">↗</span><div><strong>{record.agentName}</strong><small>{record.recordType} · {record.recordHash.slice(0, 16)}…</small></div></div><span className={`verdict verdict-${record.verdict.toLowerCase()}`}>{record.verdict.replaceAll("_", " ")}</span><span className={`confidence confidence-${record.confidence.toLowerCase()}`}>{record.confidence}</span><time>{formatDate(record.createdAt)}</time><span className="arrow">→</span></a>)}</div> : <EmptyState title="No records issued" detail="A Continuity Record appears only after an incident has persisted, eligible evidence." />}</section>
      </div>
    </section>
  </main>;
}
