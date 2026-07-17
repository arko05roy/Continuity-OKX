import AgentOnboardingForm from "../../../src/AgentOnboardingForm";
import CommandShell from "../../../src/CommandShell";

export default function AddAgentPage() {
  return <CommandShell current="agents"><header className="workspace-header"><div><p>Agent network</p><h1>Register agent</h1></div></header><div className="onboarding-layout"><section><span className="setup-step">Permissionless</span><h2>Give Continuity an autonomy contract</h2><p>Any agent can register a public HTTPS endpoint. Continuity schedules observations, opens incidents, executes permitted recovery adapters, and verifies the result without waiting for a dashboard operator.</p><ul><li>Public HTTPS endpoints only</li><li>Machine-callable through A2MCP and CLI</li><li>Humans enter only for policy and disputed evidence</li></ul></section><AgentOnboardingForm /></div></CommandShell>;
}
