import { Fingerprint, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import CommandShell from "../../../src/CommandShell";
import { ensureSchema, findEvidenceTask } from "../../../src/db";
import EvidenceSubmissionForm from "../../../src/EvidenceSubmissionForm";

export const dynamic = "force-dynamic";

export default async function EvidenceTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params; await ensureSchema(); const task = await findEvidenceTask(taskId); if (!task) notFound();
  return <CommandShell current=""><section className="evidence-workspace"><header><div><p className="kicker">VERIFIER WORKSPACE / X LAYER</p><h1>Sign what you saw.<br/><em>Nothing more.</em></h1><p>Your message becomes a reviewable evidence envelope. A signature proves authorship; a reviewer determines eligibility.</p></div><div className="evidence-seal"><Fingerprint aria-hidden="true" /><span>EIP-712</span><small>NO GAS FEE</small></div></header><div className="evidence-layout"><aside><p className="kicker">TASK BRIEF</p><dl><div><dt>Task type</dt><dd>{task.taskType.replaceAll("_", " ")}</dd></div><div><dt>Deadline</dt><dd>{new Date(task.deadline).toLocaleString()}</dd></div><div><dt>Review state</dt><dd>{task.assignmentStatus}</dd></div><div><dt>Reward</dt><dd>{task.rewardAmount} {task.rewardToken}</dd></div></dl><section><ShieldCheck aria-hidden="true" /><strong>Evidence boundary</strong><p>Only direct observations belong here. Conclusions and requested outcomes remain part of the incident claim.</p></section></aside><article><div className="instruction-card"><p className="kicker">INSTRUCTIONS</p><p>{task.instructions}</p></div><EvidenceSubmissionForm task={{ id: task.id, incidentId: task.incidentId }} /></article></div></section></CommandShell>;
}
