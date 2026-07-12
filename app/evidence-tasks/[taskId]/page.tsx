import { notFound } from "next/navigation";
import { ensureSchema, findEvidenceTask } from "../../../src/db";
import EvidenceSubmissionForm from "../../../src/EvidenceSubmissionForm";

export const dynamic = "force-dynamic";

export default async function EvidenceTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  await ensureSchema();
  const task = await findEvidenceTask(taskId);
  if (!task) notFound();
  return <main className="document-shell"><header className="document-header"><a className="back-link" href="/">← Operations overview</a><span className="document-label">Verifier workspace</span></header><article className="task-document"><p className="eyebrow">Verified Human Evidence Network</p><h1>Submit an observation</h1><p className="document-intro">Only submit what you personally observed. Your wallet will sign the evidence envelope on X Layer before it is sent for review.</p><div className="task-brief"><div><span>Task type</span><strong>{task.taskType.replaceAll("_", " ")}</strong></div><div><span>Deadline</span><strong>{new Date(task.deadline).toLocaleString()}</strong></div><div><span>Reward</span><strong>{task.rewardAmount} {task.rewardToken}</strong><small>Payment is not automated by this service.</small></div></div><section className="instructions"><p className="eyebrow">Instructions</p><p>{task.instructions}</p></section><EvidenceSubmissionForm task={{ id: task.id, incidentId: task.incidentId }} /></article></main>;
}
