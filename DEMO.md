# Continuity demo runbook

This document is private operating guidance for the presenter. The product itself must continue to look and behave like the normal production system. Never expose this file, `.env.local`, terminal secrets, Vercel environment values, or the private agent-control request in the recording.

## 1. The proof

The demo proves one continuous, real workflow:

```text
AGENT REGISTERS
      ↓
SCHEDULED OBSERVATION SEES HTTP 503
      ↓
CONTINUITY OPENS ONE INCIDENT
      ↓
REGISTERED AUTO_RECOVER POLICY SELECTS A COMPATIBLE ADAPTER
      ↓
ADAPTER RESTORES THE AGENT
      ↓
AN INDEPENDENT FOLLOW-UP OBSERVATION SEES HTTP 200
      ↓
INCIDENT BECOMES RESTORED
      ↓
HASH-VERIFIABLE RECOVERY RECORD IS ISSUED
```

No dashboard click performs the recovery. The web application is an observability and policy surface; the worker owns the lifecycle.

## 2. Truth boundary

Everything shown must be real:

- The Research Coordinator health route must actually return HTTP `503` while failed and HTTP `200` after recovery.
- Probes, incidents, recovery actions, verification probes, and records must be persisted in Neon.
- The worker must authenticate with `CRON_SECRET`.
- The private state-control route must authenticate with `DEMO_CONTROL_TOKEN`.
- The automatic-recovery claim applies only to Research Coordinator and other agents with an explicitly compatible adapter.
- Generic third-party agents are observed and escalated unless they authorize an adapter.
- No fake uptime, users, payments, reviews, signatures, or seeded incident history may appear.

Do not claim that Continuity repaired arbitrary infrastructure, used OKX escrow, made a payment, deployed code, refunded a user, or rerouted work unless an authoritative integration actually confirms that action.

## 3. Environment configuration

The local `.env.local` is already configured and ignored by Git. It contains the Neon connection and freshly generated values for `CRON_SECRET` and `DEMO_CONTROL_TOKEN`. Do not copy those values into this document.

The production deployment must contain these values in Vercel → Project → Settings → Environment Variables, scoped to **Production**:

| Variable | Required value |
|---|---|
| `DATABASE_URL` | The same Neon pooled connection string used locally. |
| `PUBLIC_BASE_URL` | `https://continuity-okx.vercel.app` |
| `CONTINUITY_URL` | `https://continuity-okx.vercel.app` |
| `A2MCP_MODE` | `free` |
| `CRON_SECRET` | Copy the value from `.env.local`. |
| `DEMO_CONTROL_TOKEN` | Copy the value from `.env.local`. |

After changing any production environment variable, redeploy. Existing deployments do not inherit newly added values.

### Scheduler limitation to check before deployment

`vercel.json` requests a one-minute schedule. Vercel Pro and Enterprise support per-minute cron execution. Vercel Hobby currently permits only once-daily schedules, so a one-minute cron configuration can fail deployment on Hobby.

For the recorded demo, the safe free path is:

1. Keep the worker endpoint and authentication exactly as implemented.
2. Trigger one worker invocation privately with `npm run cli -- worker run` after the agent is due.
3. Do not show that terminal command in the video.
4. Do not describe the private invocation as a human recovery action; it only invokes the same autonomous worker that evaluates all due contracts.

For continuous production polling, use Vercel Pro or attach a free external scheduler that sends `GET /api/cron/monitor` with `Authorization: Bearer <CRON_SECRET>`. Never put the secret in a URL.

## 4. One-time production deployment

1. Confirm that secrets are ignored:

   ```bash
   git check-ignore .env.local
   ```

   Expected output: `.env.local`.

2. Add the six production variables listed above in Vercel.

3. Deploy the current branch to production. If using Vercel CLI:

   ```bash
   vercel deploy --prod
   ```

4. Confirm the public service:

   ```bash
   curl -i https://continuity-okx.vercel.app/api/health
   curl -i https://continuity-okx.vercel.app/api/agents/research-coordinator/health
   curl -sS https://continuity-okx.vercel.app/.well-known/agent.json
   ```

   Expected results:

   - Health returns HTTP `200`.
   - Research Coordinator returns HTTP `200`; HTTP `404` means the agent-first build has not been deployed and is a hard stop.
   - The manifest says pricing is `free`.
   - A2MCP operations include registration, checks, incidents, records, and reliability profiles.
   - A2A advertises the investigation workflow.

5. Confirm that protected routes reject anonymous callers:

   ```bash
   curl -i https://continuity-okx.vercel.app/api/cron/monitor
   curl -i -X POST https://continuity-okx.vercel.app/api/internal/agent-control \
     -H 'content-type: application/json' \
     --data '{"state":"FAILED"}'
   ```

   Both requests must return HTTP `401`. This is a security check, not a failure.

6. Open the production dashboard. It must show real Neon data and must not show “Telemetry unavailable.”

7. If the deployment supports Vercel cron, open Vercel → Project → Settings → Cron Jobs and confirm `/api/cron/monitor` is registered. Vercel invokes cron only on production deployments.

## 5. Rehearsal preparation

Run every command below from the repository root. The npm scripts load `.env.local` automatically.

### A. Establish a healthy baseline

```bash
npm run agent:healthy
```

Then verify the public target directly:

```bash
curl -i https://continuity-okx.vercel.app/api/agents/research-coordinator/health
```

Expected result: HTTP `200` with a production-style JSON health response.

If the control command returns `401`, the local and Vercel `DEMO_CONTROL_TOKEN` values do not match or the production deployment was not rebuilt after setting the variable.

### B. Register the autonomy contract

Use the production **Register agent** page:

- Agent name: `Research Coordinator`
- HTTPS endpoint: `https://continuity-okx.vercel.app/api/agents/research-coordinator/health`
- Expected status: `200`
- Expected content type: `application/json`
- Check interval: `Every minute`
- Recovery policy: `Automatic recovery`

Submit once. Registration should produce a real healthy observation and return to the overview.

Machine-only alternative:

```bash
npm run cli -- agents add \
  --name "Research Coordinator" \
  --url "https://continuity-okx.vercel.app/api/agents/research-coordinator/health" \
  --interval 60 \
  --policy AUTO_RECOVER
```

Verify registration:

```bash
npm run cli -- agents list --json
```

The matching agent must have:

- `recoveryPolicy: "AUTO_RECOVER"`
- `adapterKey: "research-coordinator"`
- `enabled: true`
- a real `nextCheckAt`

If `adapterKey` is `null`, `PUBLIC_BASE_URL` does not exactly match the endpoint origin or the deployed route is not the current build. Do not proceed with the automatic-repair claim.

### C. Understand the due-time rule

Registration schedules the next observation 60 seconds after the initial check. Running the worker before `nextCheckAt` is valid but returns `checked: 0`.

For a rehearsal:

- Either wait until the listed `nextCheckAt`, then trigger failure.
- Or use an already registered agent whose `nextCheckAt` has passed.

Do not repeatedly re-register immediately before invoking the worker because registration moves the due time forward.

## 6. Full end-to-end rehearsal

### Step 1 — Start healthy

```bash
npm run agent:healthy
```

Confirm HTTP `200` from the public Research Coordinator route.

### Step 2 — Ensure the contract is due

```bash
npm run cli -- agents list --json
```

Wait until the Research Coordinator’s `nextCheckAt` is in the past.

### Step 3 — Trigger the real failure privately

```bash
npm run agent:fail
```

Confirm the target is genuinely failing:

```bash
curl -i https://continuity-okx.vercel.app/api/agents/research-coordinator/health
```

Expected result: HTTP `503`.

### Step 4 — Invoke or await the autonomous worker

If production cron is active, wait for it. For a deterministic rehearsal or free-hosting fallback:

```bash
npm run cli -- worker run
```

Expected worker output:

- `checked` is at least `1`.
- `succeeded` is at least `1`.
- `failed` is `0` for this target.

The worker itself must perform the complete chain: probe → incident → adapter → verification → record. Do not call `agent:healthy` after the failure; doing so would bypass the recovery proof.

### Step 5 — Verify the recovery independently

```bash
curl -i https://continuity-okx.vercel.app/api/agents/research-coordinator/health
npm run cli -- incidents list --json
npm run cli -- records list --json
```

Expected results:

- The health endpoint is back to HTTP `200`.
- The newest Research Coordinator incident is `RESTORED`.
- Its timeline contains an initial unhealthy probe, `RESTART_AGENT`, and a healthy verification probe.
- The newest record is a `RECOVERY_RECORD` with verdict `RESTORED` and confidence `HIGH`.
- The record contains the initial probe ID, verification probe ID, adapter key, and deterministic hash.

### Step 6 — Inspect the production UI

On the dashboard:

1. Confirm Research Coordinator appears under monitored agents.
2. Open the newest restored incident.
3. Read the timeline from top to bottom.
4. Open the linked recovery record.
5. Confirm the public record contains no secret, private control detail, or invented conclusion.

Do not record until this rehearsal succeeds once from beginning to end.

## 7. Recording setup

- Record at 1920×1080 or 1440×900.
- Keep browser zoom at 100%.
- Close bookmarks, unrelated tabs, wallet extensions, terminals, and notifications.
- Use the production URL, never localhost.
- Keep `.env.local`, Vercel settings, Neon, and the private control route off-screen.
- Pre-open only these pages:
  1. Register agent
  2. Overview
  3. The latest incident, if using a clean edit after recovery
  4. The latest recovery record
  5. The capability manifest
- Record one clean private cut while the failure trigger and worker invocation happen off-screen.
- Target 82–87 seconds so X transcoding does not push the video over 90 seconds.

## 8. Exact 87-second shot list

### 0:00–0:10 — Register an autonomous agent

Visual: production **Register agent** page. Show the HTTPS contract, one-minute interval, and Automatic recovery policy. Submit.

Voiceover:

> “AI agents fail in production, but the response still depends on a human noticing. Continuity lets any agent register its own reliability and recovery contract.”

### 0:10–0:20 — Establish normal operation

Visual: overview with Research Coordinator healthy and under an active contract.

Voiceover:

> “From here, Continuity observes it continuously. The dashboard is only observability—the agent does not need someone watching it.”

### 0:20–0:25 — Private cut

Off-screen actions:

```bash
npm run agent:fail
npm run cli -- worker run
```

Only invoke the worker when the contract is due. Cut directly back to the production overview after the command completes.

### 0:25–0:49 — Show autonomous recovery

Visual: open the newest restored incident. Move through the persisted timeline:

1. HTTP `503` observation
2. Incident opened by Continuity
3. Registered `RESTART_AGENT` action
4. Independent HTTP `200` verification
5. Incident restored

Voiceover:

> “When the endpoint returned 503, Continuity opened one incident, selected the recovery action this agent had authorized, executed it, and independently checked the endpoint again. No recovery button was clicked.”

### 0:49–1:07 — Reveal the record

Visual: open the recovery record. Hold on `RESTORED`, `HIGH`, the probe references, adapter identity, and record hash.

Voiceover:

> “Recovery is not a claim. Continuity leaves a machine-readable record containing what failed, what acted, what verified the result, and a deterministic hash.”

### 1:07–1:19 — Prove agent-native access

Visual: capability manifest. Show free pricing, A2MCP operations, A2A investigations, and the human-role boundary.

Voiceover:

> “Other agents discover Continuity directly: free A2MCP for deterministic operations, A2A for negotiated investigations, and CLI access for autonomous infrastructure.”

### 1:19–1:27 — Close

Visual: return to the restored incident or record.

Voiceover:

> “Agents will fail. Continuity makes the agent economy recover itself—and prove that it did.”

## 9. Presenter claim sheet

Safe claims:

- “Continuity automatically detected this real HTTP failure.”
- “This agent authorized this compatible recovery adapter.”
- “The worker restored Research Coordinator without a recovery click.”
- “A separate follow-up probe verified HTTP 200.”
- “The record is persisted and deterministically hashed.”
- “The deterministic A2MCP surface is free.”
- “Humans enter for policy, approval, or disputed evidence—not routine polling.”

Unsafe claims:

- “Continuity can repair every AI agent.”
- “Continuity understood and fixed arbitrary Codex code.”
- “OKX paid for or settled this recovery.”
- “The record is on-chain.”
- “The wallet signature proves the evidence is true.”
- “This is a production SLA.”
- “No human was involved anywhere.” The accurate claim is that no human operated the recovery lifecycle after failure detection; the presenter privately staged the controlled failure.

## 10. Troubleshooting

### Dashboard says Telemetry unavailable

- Confirm `DATABASE_URL` exists in the Production environment.
- Confirm the Neon database is active and accepts the pooled connection.
- Redeploy after changing the variable.
- Call `/api/health`, then inspect production function logs for the failing database route.

### `agent:healthy` or `agent:fail` returns 401

- `DEMO_CONTROL_TOKEN` differs between `.env.local` and Vercel.
- The variable was added to Preview but not Production.
- The project was not redeployed after the variable changed.

### `worker run` returns 401

- `CRON_SECRET` differs between `.env.local` and Vercel.
- `CONTINUITY_URL` points at a different deployment.
- The production deployment has not inherited the latest environment value.

### Worker reports `checked: 0`

- The agent is registered but not due.
- Run `npm run cli -- agents list --json` and wait until `nextCheckAt`.
- Do not re-register; that can schedule a new future observation.

### Failure is detected but not repaired

- Confirm `recoveryPolicy` is `AUTO_RECOVER`.
- Confirm `adapterKey` is `research-coordinator`.
- Confirm `PUBLIC_BASE_URL` exactly matches `https://continuity-okx.vercel.app`.
- Confirm the endpoint path is `/api/agents/research-coordinator/health`.
- If the adapter is absent, describe the outcome as detection and escalation, not automatic recovery.

### Adapter runs but verification fails

- Call the public health route directly.
- Inspect the incident timeline and recovery-action detail.
- Do not issue or show a `RESTORED` claim manually.
- Reset to healthy, diagnose the deployment, and repeat the rehearsal from a due contract.

### Vercel rejects the cron schedule

- The project is likely on Hobby, which does not support per-minute cron.
- Use the private authenticated `worker run` invocation for the recording.
- For persistent free operation, configure an external scheduler with the bearer header; for Vercel-native per-minute operation, use Pro or Enterprise.

## 11. After recording

1. Leave Research Coordinator healthy:

   ```bash
   npm run agent:healthy
   ```

2. Do not delete the incident or record. They are the evidence behind the video.
3. Open every public link in a signed-out browser.
4. Verify that the record reveals no credential or private evidence.
5. Export below 90 seconds.
6. Publish the X post with `#OKXAI` and link the live ASP.
7. Include the X URL and live Continuity URL in the hackathon submission form.

## 12. Final go/no-go checklist

- [ ] Current code is deployed to production.
- [ ] The production Research Coordinator health route exists and returns HTTP 200.
- [ ] All six required Production environment variables are set.
- [ ] `.env.local` is ignored and absent from Git status.
- [ ] Dashboard reads real Neon data.
- [ ] Research Coordinator returns HTTP 200 before failure.
- [ ] Registration shows `AUTO_RECOVER` and the trusted adapter.
- [ ] The contract is due before the worker invocation.
- [ ] Failure produces a real HTTP 503.
- [ ] No `agent:healthy` command is used after failure.
- [ ] Worker completes with no failed target.
- [ ] Follow-up health returns HTTP 200.
- [ ] Incident is `RESTORED`.
- [ ] Recovery record is `RESTORED / HIGH` and hash-verifiable.
- [ ] One full rehearsal has succeeded.
- [ ] No secret or private terminal appears in the capture.
- [ ] Video is under 90 seconds.
- [ ] Spoken claims stay inside the boundary above.

## 13. Operational references

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Securing Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel cron plan limits and scheduling precision](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [OKX.AI A2MCP guide](https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp)
- [OKX.AI A2A guide](https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a)
