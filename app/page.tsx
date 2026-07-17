"use client";

import { ArrowRight, BracketsCurly, CheckCircle, Clock, Plus, Robot, Terminal, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import CommandShell from "../src/CommandShell";

type DashboardData = {
  agents: { agentName: string; endpointUrl: string; latestStatus: string; lastCheckedAt: string }[];
  incidents: { id: string; publicSlug: string; agentName: string; severity: string; status: string; claim: string; updatedAt: string }[];
  evidenceTasks: { id: string; assignmentStatus: string }[];
  records: { id: string; agentName: string; verdict: string; confidence: string; createdAt: string }[];
  counts: { agents: number; openIncidents: number; evidenceTasks: number; records: number };
  autonomy: { enabled:boolean; intervalFloorSeconds:number; nextCheckAt:string|null; activePolicies:number };
};

function when(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const response = await fetch("/api/v1/dashboard", { cache: "no-store" }); const body = await response.json(); if (!response.ok || !body.data) throw new Error(); setData(body.data); setError(false); } catch { setError(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  return <CommandShell current="command" status="Autonomous worker">
    <header className="workspace-header"><div><p>Agent network</p><h1>Autonomous operations</h1></div><div className="header-actions"><span className={error ? "connection-state is-offline" : "connection-state"}><i />{error ? "Telemetry unavailable" : data?.autonomy.enabled ? "Worker active" : "Worker not configured"}</span><button className="button-secondary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button><a className="button-primary" href="/agents/new"><Plus />Register agent</a></div></header>

    <div className="workspace-content">
      {error ? <div className="inline-notice" role="alert"><WarningCircle /><div><strong>Continuity cannot reach the evidence store.</strong><span>Check DATABASE_URL or retry the connection. No operational data has been substituted.</span></div><button onClick={() => void load()}>Retry</button></div> : null}

      <section className="autonomy-bar"><span><i className={data?.autonomy.enabled ? "is-active" : ""}/><strong>{data?.autonomy.enabled ? "Autonomous monitor running" : "Autonomous monitor needs CRON_SECRET"}</strong></span><span>{data?.autonomy.activePolicies ?? 0} active contracts</span><span>{data?.autonomy.nextCheckAt ? `Next observation ${new Date(data.autonomy.nextCheckAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}` : "No observation scheduled"}</span><a href="/api/v1/capabilities">Machine capabilities <ArrowRight /></a></section>

      <section className="metric-row" aria-label="Current operations"><article><span>Monitored agents</span><strong>{data?.counts.agents ?? "—"}</strong><small>Under active contracts</small></article><article><span>Open incidents</span><strong>{data?.counts.openIncidents ?? "—"}</strong><small>In autonomous response</small></article><article><span>Evidence pending</span><strong>{data?.counts.evidenceTasks ?? "—"}</strong><small>Exception verification</small></article><article><span>Recovery records</span><strong>{data?.counts.records ?? "—"}</strong><small>Issued and hash-verifiable</small></article></section>

      <div className="overview-grid">
        <section className="panel incident-panel" id="incidents"><header><div><h2>Incidents</h2><p>Failures moving through policy, recovery, and verification.</p></div><span>{data?.counts.openIncidents ?? 0} open</span></header><div className="table-head"><span>Agent</span><span>Issue</span><span>Severity</span><span>Updated</span></div>{data?.incidents.length ? data.incidents.slice(0, 7).map((incident) => <a className="incident-row" href={`/incidents/${incident.id}`} key={incident.id}><span><i className={`status-dot severity-${incident.severity.toLowerCase()}`} /><b>{incident.agentName}</b><small>{incident.publicSlug}</small></span><span>{incident.claim}</span><span><em className={`severity severity-${incident.severity.toLowerCase()}`}>{incident.severity}</em></span><span><time>{when(incident.updatedAt)}</time><ArrowRight /></span></a>) : <div className="empty-state"><CheckCircle /><strong>No active incidents</strong><span>Continuity will place new failures here when they are observed.</span></div>}</section>

        <aside className="panel activity-panel"><header><div><h2>Recent activity</h2><p>Latest evidence-backed outcomes.</p></div></header>{data?.records.length ? <div className="activity-list">{data.records.slice(0, 5).map((record) => <a href={`/records/${record.id}`} key={record.id}><CheckCircle /><span><strong>{record.agentName}</strong><small>{record.verdict.replaceAll("_", " ")}</small></span><time>{when(record.createdAt)}</time></a>)}</div> : <div className="empty-state compact"><Clock /><strong>No records issued</strong><span>Resolved incidents will appear here.</span></div>}</aside>
      </div>

      <section className="panel agents-panel" id="agents"><header><div><h2>Monitored agents</h2><p>Autonomy contracts currently evaluated by Continuity.</p></div><a className="button-secondary" href="/agents/new"><Plus />Add agent</a></header>{data?.agents.length ? <div className="agent-list">{data.agents.map((agent) => <article key={`${agent.agentName}-${agent.endpointUrl}`}><span className={`agent-mark ${agent.latestStatus === "HEALTHY" ? "is-healthy" : ""}`}><Robot /></span><div><strong>{agent.agentName}</strong><code>{agent.endpointUrl || "No endpoint configured"}</code></div><span className={`agent-health ${agent.latestStatus === "HEALTHY" ? "is-healthy" : ""}`}><i />{agent.latestStatus.replaceAll("_", " ")}</span><time>{when(agent.lastCheckedAt)}</time></article>)}</div> : <div className="empty-state compact"><Robot /><strong>No agents monitored</strong><span>Add an HTTPS endpoint to begin collecting real reliability signals.</span><a className="button-primary" href="/agents/new"><Plus />Add first agent</a></div>}</section>
      <section className="machine-access"><div><BracketsCurly /><span><strong>A2MCP</strong><small>Deterministic reliability operations over free HTTPS endpoints.</small></span><code>GET /api/v1/capabilities</code></div><div><Robot /><span><strong>A2A</strong><small>Negotiated investigations, evidence, delivery, and buyer response.</small></span><code>POST /api/v1/a2a/investigations</code></div><div><Terminal /><span><strong>CLI</strong><small>Every core operation is scriptable by another agent or terminal.</small></span><code>npx continuity agents list</code></div></section>
    </div>
  </CommandShell>;
}
