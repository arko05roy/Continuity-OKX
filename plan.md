# Continuity: the incident-response layer for AI agents

Last updated: 2026-07-17 (Asia/Kolkata)

## 1. Product decision

Build Continuity as the operational safety layer for an agent economy.

**The job is not to promise that agents never fail.** The job is to let agents register their own reliability contracts, recover within explicit policy, verify outcomes, and escalate to humans only when judgment is genuinely required.

> When an AI agent fails, Continuity turns an opaque error into a verified recovery workflow.

The product must be useful with no paid transaction, no seeded data, and no fabricated outcome. The free demo proves an agent-native loop with a real HTTPS target: registration, scheduled detection, policy-authorized recovery, independent verification, and an automatically issued Continuity Record. Human evidence remains an exception path for disputed facts.

## 2. What real incident-response products do

This plan follows the operational shape used by incident-management systems rather than inventing a new ritual:

1. **Detect** — observe a service or agent run failing.
2. **Triage** — classify impact, severity, affected work, and owner.
3. **Diagnose** — assemble a timeline, traces, claims, and evidence.
4. **Remediate** — apply an approved recovery action and record who did it.
5. **Learn** — publish a truthful post-incident record, improve policies, and measure recovery.

Research basis:

- PagerDuty describes a five-step lifecycle: detect, triage, diagnose, remediate, and continuous learning.
- Atlassian’s major-incident process includes detection, incident creation, communications, assessment, escalation, review, and resolution.
- OpenAI’s Agents SDK tracing model records agent generations, tool calls, handoffs, and guardrails; this is the right direction for an agent-run evidence timeline.

Sources to re-open before implementing a relevant feature:

- https://www.pagerduty.com/resources/digital-operations/learn/incident-response-lifecycle-for-devops/
- https://www.atlassian.com/incident-management/itsm/major-incident-management
- https://openai.github.io/openai-agents-python/tracing/
- https://developers.openai.com/api/docs/guides/agents/integrations-observability
- https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a

## 3. Current truth — what exists now

### Working in the current codebase

- A listed OKX.AI Continuity agent, per the approval notice received on 2026-07-17.
- An existing dashboard and health endpoint at `https://continuity-okx.vercel.app`; the agent-first refactor in this plan still needs deployment.
- A restrained production operations console with real agent onboarding and no public demo mode.
- A permissionless monitored-agent registry callable from web, REST, A2MCP, and CLI.
- A scheduled autonomous worker that checks due agents and manages incident lifecycle without dashboard interaction.
- Recovery-policy contracts and a compatible automatic restart adapter with independent follow-up verification.
- A machine-readable capability manifest and CLI for registration, checks, incidents, records, worker execution, and A2A requests.
- HTTPS-only, SSRF-aware status checks with persisted probe results.
- Incident creation and retrieval.
- An incident command page that correlates probes, incidents, evidence tasks, submissions, reviews, and records by persisted timestamp.
- Evidence-task creation and a browser EVM-wallet EIP-712 signing flow on X Layer (`eip155:196`).
- Server-side signature verification, content hashing, reviewer queue, and acceptance/rejection gates.
- A protected reviewer workspace that keeps the reviewer token in browser memory only.
- Persisted Continuity Records with deterministic SHA-256 hashes and explicit confidence.
- Public, shareable recovery-record pages with evidence provenance and visible confidence boundaries.
- A free A2MCP mode. `A2MCP_MODE=free` is the default and the live demo does not require x402 payment.
- A2A investigation route/state-machine slices for intake, quoting, acceptance, payment verification handoff, execution, and buyer response.
- 14 automated tests, TypeScript validation, and a clean production build in default free mode.

### Explicitly not complete or not yet proven

- Automatic recovery currently exists only for explicitly compatible adapters; arbitrary restart, rerouting, refund, replacement, and settlement adapters are not claimed.
- Agent SDK trace ingestion and notification channels do not exist yet.
- Reviewer authentication is currently a manually entered bearer token rather than a full organization/login system.
- A real signed evidence submission followed by a reviewer acceptance has not yet been demonstrated end to end.
- A2A payment/escrow verification is a trusted internal handoff, not a live OKX escrow integration.
- The A2A marketplace listing and a full A2A delivery/dispute cycle are not claimed.

## 4. Product thesis for Best Product + Social Buzz

### Best Product

The winning experience is not a dashboard that reports an outage. It is an agent registering itself once, failing later, and being detected, contained, recovered, verified, and recorded by Continuity before a human has to notice.

### Social Buzz

The shareable unit is not “an agent failed.” It is a credible recovery story:

> An autonomous agent failed during real work. Continuity separated observations from claims, directed recovery, verified the result, and left an auditable record.

Every public surface must distinguish:

- **Observed** — direct probe or trace output.
- **Claimed** — an unverified report from a buyer, agent, or verifier.
- **Verified** — valid, accepted, hash-matched evidence.
- **Recovered** — an action whose result Continuity can actually observe.

Never produce a reliability score, recovery badge, public card, metric, payment result, or “saved” story without underlying persisted evidence.

## 5. Free demo definition of done

The demo must fit in 90 seconds and need no payment or funded wallet. It is staged privately against a public HTTPS endpoint the presenter controls; the frontend remains the normal production application with no demo mode or demo copy.

### Demo scenario

The production UI contains no scenario, fixture, sandbox, or demo state. The presenter privately stages real persisted records against a controlled public HTTPS endpoint, then records the same observability surface an agent owner may inspect in production. The complete preparation and 90-second shot list live in [`DEMO.md`](DEMO.md).

### Demo acceptance checklist

- [ ] Dashboard has no fabricated seed data.
- [ ] The production frontend contains no demo-specific language or route.
- [ ] The failed and healthy endpoint observations are both real and persisted.
- [ ] No presenter action is required between the private failure trigger and the restored incident.
- [ ] The worker persists the failed probe, recovery action, healthy verification probe, and record issuance.
- [ ] The final record contains only system-observed facts from the real run.
- [ ] The video labels the service as **free**.
- [ ] The video limits the automatic-repair claim to the compatible, policy-authorized adapter shown.

## 6. Roadmap

### Phase A — Make the current workflow product-complete (complete)

Goal: eliminate terminal/API-only steps from the core demo.

1. ✅ Build initial **agent onboarding**.
   - Add agent name, HTTPS endpoint, expected response contract, owner, and recovery policy.
   - Validate before saving; display SSRF/HTTPS constraints plainly.
2. ✅ Build an **incident command page**.
   - Timeline: probe → incident → evidence task → submission → review → record.
   - Severity, impacted work, owner, status, and next action at the top.
3. ✅ Build a **reviewer workspace**.
   - Protected login/token session.
   - Clear signature-valid, hash-matched, deadline, and evidence-source indicators.
   - Accept/reject with reviewer note and immutable audit trail.
4. ✅ Build a **record issuance flow**.
   - Preview why the verdict will be `INCONCLUSIVE` or evidence-supported before issuing.
   - Show exactly which accepted submissions are included.
5. ✅ Fix local build ergonomics.
   - Make `paidRouteConfig` safe when `PUBLIC_BASE_URL` is absent in free mode, or provide a non-blank local default/documented build command.

**Done when:** An agent can register through API or CLI and the browser provides a complete observability and policy surface without being required to operate the lifecycle.

### Phase B — Add genuine recovery capability (foundation complete)

Goal: move from recording recovery recommendations to executing safe, observable recovery actions.

1. ✅ Recovery policies: `OBSERVE_ONLY`, `RETRY_AND_ESCALATE`, and `AUTO_RECOVER`.
2. ✅ First action adapter with an explicit capability boundary and before/after evidence.
3. Agent run/trace ingestion API: attach tool calls, handoffs, guardrails, request IDs, and output hashes to an incident.
4. ✅ Timeline correlation for failed probe, incident, recovery action, verification, and record.
5. ✅ Recovery verification: never mark `RESTORED` until a real follow-up contract check succeeds.

**Done when:** The deployed Research Coordinator can fail, recover through its registered adapter, pass an independent follow-up check, and receive a persisted record with no dashboard click. A live deployed rehearsal remains required.

### Phase C — Make reliability a network effect

Goal: create talkable, privacy-safe distribution without turning failure into fake spectacle.

1. Public reliability profile with transparent inputs, observation window, and confidence.
2. Share cards for verified recoveries: incident type, recovery duration, evidence count, and redacted outcome.
3. Opt-in reliability badges for listed agents: `MONITORED`, `EVIDENCE-READY`, `RECOVERY-VERIFIED`.
4. Weekly public ecosystem report built only from aggregated, consented, anonymized records.
5. “Recovery replay” page: a readable, timestamped sequence of observed events and actions.

**Done when:** Every public post can link to a real record and every claim is verifiable from that record.

### Phase D — Production-grade collaboration and A2A

Goal: support real teams and agent-to-agent recovery work.

1. Organization workspaces, roles, service ownership, escalation policies, audit exports, and retention policies.
2. Notifications: webhook first, then Slack/Telegram/email integrations with acknowledgement and escalation tracking.
3. Real A2A payment/escrow integration only after verifying current OKX docs and completing a funded end-to-end test.
4. Buyer delivery acceptance/rejection and arbitration evidence packet.
5. Fallback-agent registry with explicit capabilities, eligibility, price, reliability evidence, and opt-in routing.

**Done when:** No payment or external delivery state is asserted without an authoritative provider confirmation.

## 7. UX principles

- Lead with the next safe action, not raw telemetry.
- Keep observed facts, claims, reviewer decisions, and automated actions visibly distinct.
- Do not make a wallet mandatory until evidence signing is required.
- A single incident page must answer: what broke, who is affected, what is known, what is disputed, what happens next, and who can act.
- Prefer calm, institutional language: `incident`, `contain`, `verify`, `recover`, `record`, `restored`.
- Make public sharing opt-in and redact sensitive evidence by default.

## 8. Data and security requirements

- HTTPS-only target validation; resolve and reject private/local destinations before probing.
- Redirect blocking, bounded timeouts, request-size limits, and append-only audit events for decisions/actions.
- Encrypt secrets at rest and never return reviewer/A2A tokens to the browser.
- Separate public records from private evidence. A hash may be public while the underlying evidence is restricted.
- Require idempotency keys and explicit approval for any future recovery action with external side effects.
- Record the actor, timestamp, input hash, output hash, and verification status for every state transition.

## 9. Metrics that are allowed to matter

Only compute or publish metrics from real persisted data:

- Mean time to detect (MTTD).
- Mean time to verified recovery (MTTVR).
- Percentage of incidents with accepted evidence.
- Recovery action success rate.
- False-positive rate for monitors.
- Median time from evidence submission to reviewer decision.

Do not publish a global “agent trust score” until the observation window, inputs, confidence, and appeals process are complete.

## 10. Submission strategy

Primary category: **Software Utility**.

Secondary story: **Best Product** through an unusually complete, truthful incident command flow.

Social strategy: one short recovery story, one public record link, one crisp visual, and no manufactured engagement. The social post should lead with the problem, show the moment of detection, then end with the evidence-backed record.

## 11. Immediate next actions

1. Deploy the registry, autonomous worker, recovery adapter, capability manifest, CLI, and observability UI.
2. Configure `DATABASE_URL`, `CRON_SECRET`, `DEMO_CONTROL_TOKEN`, and `PUBLIC_BASE_URL`.
3. Follow `DEMO.md` and rehearse one complete autonomous failure-to-record cycle on the deployed service.
4. Capture the 90-second video from the production interface; keep the private failure trigger off-screen.
5. Add the video and exact OKX.AI listing URLs to the README.
6. Publish the X post with `#OKXAI`, verify the public links, and submit the form.
