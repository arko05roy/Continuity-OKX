"use client";

import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  agents: { agentName: string; endpointUrl: string; latestStatus: string; lastCheckedAt: string }[];
  incidents: { id: string; publicSlug: string; agentName: string; incidentType: string; severity: string; status: string; claim: string; updatedAt: string }[];
  evidenceTasks: { id: string; incidentId: string; taskType: string; assignmentStatus: string; deadline: string }[];
  records: { id: string; agentName: string; recordType: string; verdict: string; recordHash: string; createdAt: string }[];
  counts: { agents: number; openIncidents: number; evidenceTasks: number; records: number };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function StatusDot({ status }: { status: string }) {
  return <span className={`status-dot status-${status.toLowerCase()}`} aria-label={status} />;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-mark">—</span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard data could not be retrieved.");
      const payload = await response.json() as { data: DashboardData };
      setData(payload.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard data could not be retrieved.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  return <main className="shell">
    <aside className="rail">
      <div className="brand"><span className="brand-mark">C</span><div><strong>Continuity</strong><small>OKX.AI reliability</small></div></div>
      <nav aria-label="Primary navigation">
        <a className="active" href="#overview"><span>◈</span> Overview</a>
        <a href="#incidents"><span>＋</span> Incidents</a>
        <a href="#evidence"><span>◌</span> Evidence tasks</a>
        <a href="#records"><span>▧</span> Records</a>
      </nav>
      <div className="rail-footer"><span className="live-indicator" /> API connected<br /><code>/api/v1/dashboard</code></div>
    </aside>

    <section className="workspace" id="overview">
      <header className="topbar"><div><p className="eyebrow">Reliability control room</p><h1>Operational overview</h1></div><button className="refresh" onClick={() => void loadDashboard()} disabled={loading}>{loading ? "Refreshing…" : "Refresh records"}<span>↻</span></button></header>
      {error ? <div className="error-banner" role="alert"><strong>Data unavailable</strong><span>{error} Check the database connection and try again.</span><button onClick={() => void loadDashboard()}>Retry</button></div> : null}
      <div className="content">
        <section className="signal-band"><div><span className="signal-kicker">Continuity signal</span><h2>{loading ? "Reading persisted records…" : data?.counts.agents ? "Evidence-backed operations, at a glance." : "Your reliability record starts here."}</h2><p>{data?.counts.agents ? "Live status, incidents, and recovery records from the connected service." : "Connect a real agent probe or open an incident to populate this workspace."}</p></div><div className="signal-glyph" aria-hidden="true"><i /><i /><i /></div></section>
        <section className="metric-grid" aria-label="System totals">
          <div className="metric"><span>Tracked agents</span><strong>{data?.counts.agents ?? "—"}</strong><small>From probes and incidents</small></div>
          <div className="metric"><span>Open incidents</span><strong>{data?.counts.openIncidents ?? "—"}</strong><small>Requires attention</small></div>
          <div className="metric"><span>Evidence queue</span><strong>{data?.counts.evidenceTasks ?? "—"}</strong><small>Open or under review</small></div>
          <div className="metric"><span>Continuity records</span><strong>{data?.counts.records ?? "—"}</strong><small>Persisted outputs</small></div>
        </section>

        <div className="section-heading"><div><p className="eyebrow">Registry</p><h2>Agents</h2></div><span className="section-note">{data?.agents.length ?? 0} observed</span></div>
        <section className="agent-grid">{data?.agents.length ? data.agents.map((agent) => <article className="agent-row" key={`${agent.agentName}-${agent.endpointUrl}`}><div className="agent-identity"><StatusDot status={agent.latestStatus} /><div><strong>{agent.agentName}</strong><small>{agent.endpointUrl || "No probe endpoint declared"}</small></div></div><div className="agent-status"><span>{agent.latestStatus}</span><small>{formatDate(agent.lastCheckedAt)}</small></div></article>) : <EmptyState title="No agents observed" detail="Run a real HTTPS status check to add the first agent to the registry." />}</section>

        <div className="split-grid">
          <section className="panel" id="incidents"><div className="panel-heading"><div><p className="eyebrow">Cases</p><h2>Open incidents</h2></div><span className="count-badge">{data?.counts.openIncidents ?? 0}</span></div>{data?.incidents.length ? <div className="table-wrap"><table><thead><tr><th>Incident</th><th>Agent</th><th>Severity</th><th>Status</th><th>Updated</th></tr></thead><tbody>{data.incidents.map((incident) => <tr key={incident.id}><td><strong>{incident.publicSlug}</strong><small>{incident.claim}</small></td><td>{incident.agentName}</td><td><span className={`severity severity-${incident.severity.toLowerCase()}`}>{incident.severity}</span></td><td>{incident.status}</td><td>{formatDate(incident.updatedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No incidents recorded" detail="Only caller-submitted incidents appear here." />}</section>
          <section className="panel" id="evidence"><div className="panel-heading"><div><p className="eyebrow">Verification</p><h2>Evidence queue</h2></div><span className="count-badge">{data?.counts.evidenceTasks ?? 0}</span></div>{data?.evidenceTasks.length ? <div className="task-list">{data.evidenceTasks.map((task) => <div className="task-row" key={task.id}><div><strong>{task.taskType.replaceAll("_", " ")}</strong><small>{task.id}</small></div><span className="task-status">{task.assignmentStatus}</span><time>{formatDate(task.deadline)}</time></div>)}</div> : <EmptyState title="Evidence queue is clear" detail="No human verification tasks have been created." />}</section>
        </div>

        <section className="panel records-panel" id="records"><div className="panel-heading"><div><p className="eyebrow">Public output</p><h2>Continuity records</h2></div><span className="section-note">Hashes are verifiable</span></div>{data?.records.length ? <div className="record-list">{data.records.map((record) => <a className="record-row" href={`/api/v1/records/${record.id}`} key={record.id}><div className="record-id"><span className="record-icon">▧</span><div><strong>{record.agentName}</strong><small>{record.recordType} · {record.recordHash.slice(0, 16)}…</small></div></div><span className={`verdict verdict-${record.verdict.toLowerCase()}`}>{record.verdict.replaceAll("_", " ")}</span><time>{formatDate(record.createdAt)}</time><span className="arrow">↗</span></a>)}</div> : <EmptyState title="No records issued" detail="Issue a Continuity Record after an incident has real persisted evidence." />}</section>
      </div>
    </section>
  </main>;
}
