import { notFound } from "next/navigation";
import { ensureSchema, findContinuityRecord } from "../../../src/db";

export const dynamic = "force-dynamic";

export default async function ContinuityRecordPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  await ensureSchema();
  const record = await findContinuityRecord(recordId);
  if (!record) notFound();
  const evidence = record.evidenceSummary;
  return <main className="document-shell">
    <header className="document-header"><a className="back-link" href="/">← Operations overview</a><span className="document-label">Continuity record</span></header>
    <article className="record-document">
      <div className="record-document-top"><div><p className="eyebrow">Public reliability output</p><h1>{record.agentName}</h1><p className="document-meta">{record.recordType.replaceAll("_", " ")} · issued {new Date(record.createdAt).toLocaleString()}</p></div><span className={`document-verdict verdict-${record.verdict.toLowerCase()}`}>{record.verdict.replaceAll("_", " ")}</span></div>
      <div className="document-rule" />
      <div className="document-grid"><section><p className="eyebrow">Assessment</p><h2>Incident assessment</h2><div className="assessment-copy"><p><strong>Root cause</strong>{record.rootCause}</p><p><strong>Impact</strong>{record.impactSummary}</p></div></section><section className="confidence-block"><p className="eyebrow">Confidence</p><strong>{record.confidence}</strong><small>Based on persisted evidence review state.</small></section></div>
      <div className="document-grid lower"><section><p className="eyebrow">Evidence</p><h2>Evidence summary</h2><div className="evidence-stats"><div><strong>{String(evidence.totalSubmissions ?? 0)}</strong><small>submitted</small></div><div><strong>{String(evidence.acceptedSubmissions ?? 0)}</strong><small>accepted</small></div><div><strong>{String(evidence.rejectedSubmissions ?? 0)}</strong><small>rejected</small></div><div><strong>{String(evidence.pendingSubmissions ?? 0)}</strong><small>pending</small></div></div><div className="wallet-list">{Array.isArray(evidence.signedVerifiers) && evidence.signedVerifiers.length ? <>{evidence.signedVerifiers.map((wallet) => <code key={String(wallet)}>{String(wallet)}</code>)}</> : <p>No accepted signed verifier is included in this record.</p>}</div></section><section><p className="eyebrow">Recovery</p><h2>Recommended actions</h2><ul className="action-list">{record.recommendedActions.map((action) => <li key={action}>{action}</li>)}</ul></section></div>
      <div className="hash-block"><span>Record hash · SHA-256</span><code>{record.recordHash}</code></div>
      <details className="machine-record"><summary>View machine-readable JSON</summary><pre>{JSON.stringify(record, null, 2)}</pre></details>
    </article>
  </main>;
}
