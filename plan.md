# Continuity: Evidence and Recovery Rails for OKX.AI Agents

Last updated: 2026-07-12 Asia/Kolkata

## 0. Decision

Build **Continuity**.

Continuity is a professional, production-grade ASP for OKX.AI that monitors agent reliability, verifies disputed agent outcomes with signed human evidence, and produces recovery-ready incident records for autonomous commerce.

Public positioning:

> Continuity provides reliability, evidence, and recovery infrastructure for OKX.AI agents.

X/demo hook:

> Every agent economy needs a way to recover when agents fail.

Do not use gothic/funeral language in the product UI, marketplace listing, or OKX-facing copy. The "Agent Funeral Home" idea survives only as the underlying emotional hook for the demo narrative. Product language must be institutional: incident, recovery, continuity, evidence, reliability, verifier, root cause, record, restored.

## 1. Why this should win

OKX.AI is recruiting Agent Service Providers (ASPs) that can turn services into monetizable agent-native offerings. The hackathon requires a listed ASP on OKX.AI, an X post with #OKXAI, and a demo/walkthrough not longer than 90 seconds. The submission deadline is July 17, 2026 23:59 UTC.

Continuity fits the OKX direction because OKX.AI creates an agent marketplace, Onchain OS creates agent wallets/payments, and Agent Payments Protocol is explicitly about the full commercial lifecycle: quote, pay, meter, escrow, settle, and dispute.

The missing marketplace institution is not "another agent." It is the trust and recovery layer for when agents fail.

Prize targeting:

1. **Creative Genius**: "recovery rails for failed autonomous agents" is novel but professional.
2. **Software Utility**: practical ASP monitoring, evidence capture, incident reports, recovery packets.
3. **Best Product**: complete workflow that solves an immediate OKX.AI marketplace trust gap.
4. **Revenue Rocket**: paid A2MCP endpoints priced per check/report plus A2A investigation service.
5. **Social Buzz**: public Continuity Records are shareable without sounding unserious.

## 2. Source-backed constraints

All implementation decisions below are based on current docs checked on 2026-07-12. Do not rely on memory when implementing; reopen these sources first.

### OKX.AI and ASP docs

- Hackathon page: https://web3.okx.com/xlayer/build-x-series
- ASP introduction: https://web3.okx.com/onchainos/dev-docs/okxai/asp-introduction
- A2MCP guide: https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- A2A guide: https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a
- ASP registration: https://web3.okx.com/onchainos/dev-docs/okxai/registerasp
- Agent installation guide: https://web3.okx.com/onchainos/dev-docs/okxai/agent-installation-guide

Doc constraints to obey:

- A2MCP is for standardized callable APIs. It can be free or pay-per-call.
- Paid A2MCP endpoints must use x402: first return HTTP `402 Payment Required`, then replay after payment.
- A2A is for complex customized tasks that require judgment, negotiation, and delivery follow-up.
- ASPs can register as A2A, A2MCP, or both.
- A2MCP is fully automated after review/listing.
- A2A funds are held in escrow on X Layer and released after user approval.
- If an A2A user rejects delivery, the ASP may initiate arbitration within the documented window and must post a 5% bounty deposit.
- Registration/listing happens through Onchain OS prompts, including:
  - `Help me register an A2MCP ASP on OKX.AI using Onchain OS`
  - `Help me register an A2A ASP on OKX.AI using Onchain OS`
  - `Help me list my ASP on OKX.AI using Onchain OS`

### Payment docs

- Payment overview: https://web3.okx.com/onchainos/dev-docs/payments/overview
- Agent Payments Protocol: https://web3.okx.com/onchainos/dev-docs/payments/app
- Sell DApp/MCP services: https://web3.okx.com/onchainos/dev-docs/payments/service-seller
- Integrate via SDK: https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk
- SDK overview: https://web3.okx.com/onchainos/dev-docs/payments/sdk-overview
- Node SDK reference: https://web3.okx.com/onchainos/dev-docs/payments/sdk-nodejs
- HTTP API one-time payment: https://web3.okx.com/onchainos/dev-docs/payments/api-http-onetime
- TypeScript seller reference: https://raw.githubusercontent.com/okx/payments/main/typescript/SELLER.md

Payment constraints to obey:

- Network is X Layer mainnet: `eip155:196`.
- Default OKX TypeScript seller reference says seller server scope is X Layer only.
- Default payment token in the TypeScript reference is USDT0 `0x779ded0c9e1022225f8e0630b35a9b54be713736`, 6 decimals.
- For `@okxweb3/x402-*`, call `await resourceServer.initialize()` after server start and before handling paid requests.
- For fixed price per call, use x402 `exact` on X Layer unless a later doc update says otherwise.
- Prefer OKX Payment SDK over hand-rolled x402 unless there is a strong reason.

Current npm versions checked on 2026-07-12:

- `@okxweb3/x402-express`: `0.1.1`
- `@okxweb3/x402-core`: `0.1.0`
- `@okxweb3/x402-evm`: `0.2.1`
- `express`: `5.2.1`
- `zod`: `4.4.3`
- `viem`: `2.55.0`
- `better-sqlite3`: `12.11.1`

### Onchain OS and Agentic Wallet docs

- Onchain OS overview: https://web3.okx.com/onchainos/dev-docs/home/what-is-onchainos
- Agentic Wallet overview: https://web3.okx.com/onchainos/dev-docs/home/agentic-wallet-overview
- Onchain OS skills repo: https://github.com/okx/onchainos-skills
- Onchain OS skills README: https://raw.githubusercontent.com/okx/onchainos-skills/main/README.md

Important constraints:

- Onchain OS supports Skills and Open API integration.
- Agentic Wallet is built for AI agents, with TEE-secured signing and autonomous payments.
- Onchain OS skills include `okx-ai` for agent identity/task marketplace, `okx-agent-payments-protocol` for x402/MPP/A2A payments, and `okx-agentic-wallet` for wallet lifecycle and transaction safety.
- Production usage requires real OKX API credentials:
  - `OKX_API_KEY`
  - `OKX_SECRET_KEY`
  - `OKX_PASSPHRASE`
- Never commit these credentials. Never paste them into chat. Never log them.

### X Layer and OKX strategy sources

- X Layer page: https://web3.okx.com/xlayer
- X Layer docs repo: https://github.com/okx/xlayer-docs
- Exchange OS article: https://www.okx.com/en-us/learn/exchange-os
- Agent Payments Protocol article: https://www.okx.com/en-us/learn/agent-payments-protocol

Strategic constraints:

- OKX is positioning X Layer as the infrastructure for onchain markets and agent commerce.
- Continuity must feel like institutional market infrastructure, not a consumer toy.
- Use "reliability," "risk," "evidence," "incident," "recovery," "settlement," and "agent commerce" vocabulary.

### Adjacent hackathon pattern sources

Use these projects as pattern evidence, not as things to copy:

- Human as a Service: https://ethglobal.com/showcase/human-as-a-service-3jd8e
- Open Human: https://ethglobal.com/showcase/open-human-er4dy
- Execution Market: https://ethglobal.com/showcase/execution-market-xc51v
- hands for ai: https://ethglobal.com/showcase/hands-for-ai-n9q6n
- Ghost in the Machine: https://ethglobal.com/showcase/ghost-in-the-machine-x21o8
- BehaviorChain: https://ethglobal.com/showcase/behaviorchain-q8en2
- DeadSwitch: https://ethglobal.com/showcase/deadswitch-gcu1m
- Jurex Network: https://ethglobal.com/showcase/jurex-network-06nx0
- Aegis402: https://ethglobal.com/showcase/aegis402-o8x6z
- DIVE: https://ethglobal.com/showcase/dive-5hxbp
- npmguard: https://ethglobal.com/showcase/npmguard-aeihd

Pattern conclusion:

- "AI hires humans" is credible but crowded.
- "Agent lifecycle/failure" is more memorable but must be made professional.
- Continuity merges both: agent reliability incidents resolved through signed human evidence.

## 3. Product definition

Continuity is both:

1. **A2MCP service**: standardized paid API calls for reliability checks, incident intake, evidence requests, and public record lookup.
2. **A2A service**: complex investigation and recovery workflow where Continuity acts as a reliability investigator for disputed agent tasks.

### One-sentence marketplace description

Continuity monitors OKX.AI agents, verifies disputed outcomes with signed human evidence, and produces recovery-ready incident records for autonomous commerce.

### Public service list

A2MCP services:

1. `check_agent_status`
2. `open_incident`
3. `request_human_evidence`
4. `submit_evidence`
5. `verify_delivery`
6. `issue_continuity_record`
7. `get_agent_reliability_profile`
8. `find_replacement_service`

A2A service:

1. "Investigate a failed or disputed agent/ASP delivery and produce an evidence-backed recovery packet."

### Core objects

#### Agent

Represents an OKX.AI ASP, A2MCP endpoint, A2A agent, or external agent-like service.

Fields:

- `id`: internal UUID
- `okxAgentId`: optional string if available
- `displayName`
- `serviceType`: `A2MCP | A2A | HYBRID | EXTERNAL`
- `endpointUrl`: optional, required for automated uptime/probe checks
- `marketplaceUrl`: optional
- `ownerWallet`: optional EVM address
- `declaredCapabilities`: string[]
- `declaredSla`: JSON object
- `createdAt`
- `updatedAt`

#### ReliabilityProbe

Automated health or behavior check.

Fields:

- `id`
- `agentId`
- `probeType`: `UPTIME | PAYMENT_FLOW | DELIVERY_SCHEMA | POLICY_ADHERENCE | PROMPT_INJECTION | FAKE_RECEIPT | OVERSPEND | RESPONSE_QUALITY`
- `status`: `PASS | WARN | FAIL | ERROR`
- `startedAt`
- `completedAt`
- `inputHash`
- `outputHash`
- `summary`
- `evidenceRefs`: string[]

#### Incident

A case opened because an agent failed, disappeared, delivered poor output, or was disputed.

Fields:

- `id`
- `publicSlug`
- `agentId`
- `openedBy`: wallet/address/API caller/agent ID
- `incidentType`: `UNAVAILABLE | FAILED_DELIVERY | DISPUTED_DELIVERY | POLICY_BREACH | PAYMENT_FAILURE | SECURITY_RISK | FRAUD_CLAIM | RECOVERY_REQUEST`
- `severity`: `LOW | MEDIUM | HIGH | CRITICAL`
- `status`: `OPEN | EVIDENCE_REQUESTED | UNDER_REVIEW | RESOLVED | RESTORED | ESCALATED`
- `claim`
- `requestedOutcome`: `REFUND | REDELIVERY | WARNING | SUSPENSION | REPLACEMENT | RECORD_ONLY`
- `createdAt`
- `updatedAt`

#### HumanEvidenceTask

A task assigned to a verified human witness.

Fields:

- `id`
- `incidentId`
- `taskType`: `CALL_BUSINESS | VISIT_URL | VERIFY_SCREENSHOT | VERIFY_DELIVERY | LOCATION_CHECK | DOCUMENT_CHECK | MANUAL_QA | MERCHANT_STATUS | CUSTOM`
- `instructions`
- `rewardAmount`
- `rewardToken`
- `deadline`
- `assignedToWallet`
- `assignmentStatus`: `OPEN | CLAIMED | SUBMITTED | ACCEPTED | REJECTED | PAID`
- `createdAt`
- `updatedAt`

#### EvidenceSubmission

Human-submitted or automated evidence. No fake evidence allowed.

Fields:

- `id`
- `taskId`
- `incidentId`
- `submittedByWallet`
- `evidenceType`: `TEXT | URL | SCREENSHOT | PHOTO | AUDIO | VIDEO | JSON | HTTP_TRACE | TX_HASH`
- `contentUri`: URL/IPFS/S3/R2 object reference
- `contentHash`: SHA-256
- `statement`
- `signature`: EIP-712 signature over evidence envelope
- `signedAt`
- `reviewStatus`: `PENDING | ACCEPTED | REJECTED`

#### ContinuityRecord

Public, professional incident output.

Fields:

- `id`
- `incidentId`
- `agentId`
- `recordType`: `STATUS_RECORD | INCIDENT_RECORD | RECOVERY_RECORD | RELIABILITY_PROFILE`
- `verdict`: `HEALTHY | DEGRADED | UNAVAILABLE | DELIVERY_NOT_VERIFIED | DELIVERY_VERIFIED | COMPROMISED | RESTORED | INCONCLUSIVE`
- `rootCause`
- `impactSummary`
- `evidenceSummary`
- `recommendedActions`
- `replacementServices`: array
- `recordHash`
- `signature`
- `publicUrl`
- `createdAt`

## 4. Non-negotiable "no mock/fake" policy

The user explicitly requested real docs and no fake/mocked work. This project must follow that standard.

Allowed:

- Local development with real code paths.
- Test mode only when explicitly labeled as local development and never shown as production proof.
- Real paid x402 endpoint with low price.
- Real free endpoint if payment setup is blocked, but it must be disclosed as free and not presented as paid.
- Real human evidence from team members/friends as witnesses if they actually submit signed evidence.
- Real HTTP probes against live endpoints.
- Real database records.
- Real deployed public URL.
- Real onchain X Layer evidence anchoring if time permits.

Not allowed:

- Fake screenshots.
- Fake transaction hashes.
- Fake OKX approval/listing.
- Fake human submissions.
- Fake "paid" calls that did not use OKX x402 or A2A payment.
- Fake uptime history.
- Fake incident outcomes.
- Pretending local seed data is production data.

Demo fallback if OKX listing is delayed:

- State clearly: "ASP submitted; service is live at this public endpoint; listing approval pending."
- Still demo real x402 `402 Payment Required` behavior if credentials are available.
- If credentials are not available, demo the free A2MCP-compatible endpoint and state that payment protection is awaiting OKX API credentials.

## 5. Architecture

### High-level components

1. **API service**
   - Node.js + TypeScript + Express.
   - Hosts A2MCP-compatible endpoints.
   - Uses OKX x402 middleware for paid routes.
   - Validates request/response schemas with Zod.

2. **Dashboard**
   - Next.js or Vite React.
   - Public landing is not marketing-first; first screen is the working dashboard.
   - Shows agent status, incidents, evidence tasks, and Continuity Records.

3. **Worker**
   - Node.js worker process.
   - Runs uptime probes, endpoint replay checks, evidence review queue, record generation.
   - Can be cron-based for hackathon speed.

4. **Database**
   - SQLite for speed during hackathon using `better-sqlite3`.
   - If deploying to Vercel/Render/Fly and persistent disk is awkward, use Neon Postgres instead.
   - Do not use browser local storage for core records.

5. **Evidence storage**
   - Store text/JSON evidence in DB.
   - Store screenshots/photos in object storage if needed.
   - For hackathon speed: Cloudflare R2, Supabase Storage, or S3-compatible storage.
   - Always compute SHA-256 hash and store it in DB.

6. **Evidence signing**
   - Human verifiers sign an EIP-712 evidence envelope using an EVM wallet.
   - If OKX Agentic Wallet supports signing through the chosen agent workflow, prefer it.
   - Otherwise use browser wallet signing via viem/wagmi.

7. **Optional X Layer anchoring**
   - Deploy `ContinuityRegistry.sol` on X Layer.
   - Store only hashes, no personal/private evidence.
   - Functions:
     - `anchorIncident(bytes32 incidentHash, string publicUri)`
     - `anchorEvidence(bytes32 evidenceHash, string evidenceUri)`
     - `anchorRecord(bytes32 recordHash, string publicUri)`

### Recommended repo structure

```text
continuity/
  apps/
    api/
      src/
        index.ts
        config.ts
        routes/
          status.ts
          incidents.ts
          evidence.ts
          records.ts
          public.ts
        payments/
          okxX402.ts
        services/
          agentRegistry.ts
          probes.ts
          incidentScoring.ts
          evidenceTasks.ts
          evidenceSigning.ts
          recordGenerator.ts
          replacementFinder.ts
        db/
          schema.sql
          db.ts
          migrations.ts
        workers/
          probeWorker.ts
          reviewWorker.ts
        types/
          api.ts
          domain.ts
      package.json
      tsconfig.json
    web/
      src/
        app/
        components/
        lib/
      package.json
  contracts/
    src/
      ContinuityRegistry.sol
    test/
    foundry.toml
  docs/
    okx-source-map.md
    asp-listing-copy.md
    demo-script.md
    risk-register.md
  .env.example
  README.md
```

## 6. A2MCP endpoint design

All endpoints must return JSON. Every endpoint must include a `requestId`.

### Endpoint: `GET /health`

Purpose:

- Public uptime check for deployment.

Response:

```json
{
  "ok": true,
  "service": "continuity-api",
  "time": "2026-07-12T00:00:00.000Z"
}
```

### Endpoint: `POST /v1/check-agent-status`

Purpose:

- Standardized API call that checks whether an agent/ASP endpoint is alive and whether its declared interface is reachable.

Payment:

- Paid A2MCP endpoint.
- Start price: `$0.01` in OKX x402 exact mode.

Request:

```json
{
  "agentName": "string",
  "endpointUrl": "https://...",
  "expectedStatus": 200,
  "expectedContentType": "application/json",
  "timeoutMs": 8000
}
```

Validation:

- `endpointUrl` must be HTTPS.
- Reject private IP ranges, localhost, link-local, metadata IPs, and internal hostnames to avoid SSRF.
- `timeoutMs` max 15000.

Response:

```json
{
  "requestId": "uuid",
  "agentName": "Example Agent",
  "status": "HEALTHY",
  "http": {
    "reachable": true,
    "statusCode": 200,
    "latencyMs": 342,
    "contentType": "application/json"
  },
  "continuityScore": 94,
  "recommendedAction": "No action required",
  "recordUrl": "https://..."
}
```

### Endpoint: `POST /v1/open-incident`

Purpose:

- Create a real incident record for a failed/disputed agent service.

Payment:

- Free or low-price initially. If paid, `$0.05`.

Request:

```json
{
  "agentName": "string",
  "agentId": "optional-okx-agent-id",
  "endpointUrl": "optional https URL",
  "incidentType": "FAILED_DELIVERY",
  "severity": "MEDIUM",
  "claim": "The agent claimed it booked a service, but the provider has no booking.",
  "requestedOutcome": "REFUND",
  "evidenceUrls": ["https://..."]
}
```

Response:

```json
{
  "requestId": "uuid",
  "incidentId": "uuid",
  "status": "OPEN",
  "publicUrl": "https://.../incidents/INC-...",
  "nextActions": [
    "Request human evidence",
    "Run agent availability probe",
    "Generate preliminary continuity record"
  ]
}
```

### Endpoint: `POST /v1/request-human-evidence`

Purpose:

- Create a real human verification task attached to an incident.

Payment:

- Paid endpoint. Price should include platform fee only at MVP stage; actual human reward can be handled manually or via A2A/OKX task until payout automation is ready.

Request:

```json
{
  "incidentId": "uuid",
  "taskType": "CALL_BUSINESS",
  "instructions": "Call the provider and verify whether booking ABC exists.",
  "rewardAmount": "1.00",
  "rewardToken": "USDT0",
  "deadlineMinutes": 90
}
```

Response:

```json
{
  "requestId": "uuid",
  "taskId": "uuid",
  "status": "OPEN",
  "claimUrl": "https://.../evidence-tasks/TASK-...",
  "submitUrl": "https://.../evidence-tasks/TASK-.../submit"
}
```

### Endpoint: `POST /v1/submit-evidence`

Purpose:

- Submit signed human evidence.

Payment:

- Free. The worker is doing work for Continuity, not buying a report.

Request:

```json
{
  "taskId": "uuid",
  "walletAddress": "0x...",
  "statement": "I called the provider. They confirmed no booking exists.",
  "evidenceType": "TEXT",
  "contentUri": "optional-url",
  "contentHash": "sha256-hex",
  "signature": "0x..."
}
```

Response:

```json
{
  "requestId": "uuid",
  "submissionId": "uuid",
  "verification": {
    "signatureValid": true,
    "contentHashMatched": true
  },
  "status": "PENDING_REVIEW"
}
```

### Endpoint: `POST /v1/issue-continuity-record`

Purpose:

- Produce the final incident/recovery record.

Payment:

- Paid endpoint. Start price: `$0.10`.

Request:

```json
{
  "incidentId": "uuid",
  "recordType": "INCIDENT_RECORD"
}
```

Response:

```json
{
  "requestId": "uuid",
  "recordId": "uuid",
  "verdict": "DELIVERY_NOT_VERIFIED",
  "rootCause": "The agent asserted external completion without verifiable confirmation.",
  "recommendedActions": [
    "Request redelivery or refund",
    "Require external confirmation for future bookings",
    "Lower reliability score until restored"
  ],
  "recordHash": "sha256-hex",
  "publicUrl": "https://.../records/REC-..."
}
```

### Endpoint: `GET /v1/agents/:id/reliability-profile`

Purpose:

- Public profile lookup.

Payment:

- Free for demo and social distribution.

Response:

```json
{
  "agentId": "uuid",
  "displayName": "Example Agent",
  "continuityScore": 86,
  "status": "DEGRADED",
  "incidents": {
    "open": 1,
    "resolved": 4,
    "critical": 0
  },
  "lastCheckedAt": "iso",
  "publicRecords": []
}
```

## 7. OKX x402 integration design

Use Express and the OKX x402 packages.

Install:

```bash
npm install express@5.2.1 @okxweb3/x402-express@0.1.1 @okxweb3/x402-core@0.1.0 @okxweb3/x402-evm@0.2.1 zod@4.4.3 viem@2.55.0 better-sqlite3@12.11.1
npm install -D typescript tsx @types/express @types/node
```

Environment:

```bash
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
PAY_TO=0xYourReceivingWallet
PUBLIC_BASE_URL=https://your-deployment.example
DATABASE_URL=./continuity.db
```

Implementation rules:

1. Load env vars at boot and fail fast if a paid route is enabled but OKX credentials or `PAY_TO` are missing.
2. Use X Layer network only: `eip155:196`.
3. Use USDT0 default token from OKX seller reference.
4. Use `ExactEvmScheme` for fixed-price endpoints.
5. Protect only paid API routes with x402 middleware.
6. Keep `/health`, public records, and evidence submission free.
7. Call `await resourceServer.initialize()` after `app.listen`.
8. Log request IDs, not secrets.
9. Include a curl verification section in README:
   - call paid endpoint without payment and confirm `402 Payment Required`.
   - call free endpoint and confirm JSON.

Important: do not invent package API names during implementation. Reopen:

- https://raw.githubusercontent.com/okx/payments/main/typescript/SELLER.md
- https://web3.okx.com/onchainos/dev-docs/payments/sdk-nodejs

## 8. A2A investigation workflow

Continuity's A2A service is the premium, differentiated piece.

Marketplace service name:

> Continuity Investigation: evidence-backed recovery packet for failed or disputed agent deliveries.

Default pricing:

- Hackathon: 1-5 USDT depending on scope.
- Minimum viable package: 1 USDT.

Service description:

> Submit an agent/ASP failure, disputed delivery, or unavailable service. Continuity will collect automated checks, coordinate signed human evidence where needed, and deliver a professional incident record with root cause, impact summary, recommended recovery actions, and evidence references.

Delivery format:

- Public/private Continuity Record URL.
- JSON evidence packet.
- Markdown summary.
- Suggested OKX.AI dispute/arbitration evidence package.

A2A flow:

1. Buyer opens task with failed agent details.
2. Continuity agent accepts only if:
   - task has specific agent/service target;
   - requested outcome is not illegal/abusive;
   - required evidence is obtainable;
   - budget covers at least one automated check or human verification.
3. Continuity opens an internal incident.
4. Continuity runs automated probes.
5. If real-world or subjective verification is required, Continuity creates human evidence tasks.
6. Human verifier signs evidence.
7. Continuity reviews evidence.
8. Continuity generates record.
9. Continuity delivers record to buyer.
10. Buyer accepts or rejects.
11. If rejected, Continuity uses evidence packet to decide whether arbitration is worth the 5% deposit.

## 9. Human Evidence Network

This is the professionalized Proof-of-Workforce layer.

Name in product:

> Verified Human Evidence Network

Do not call it "Proof-of-Workforce" publicly unless used in technical explanation.

### Verifier onboarding

MVP onboarding:

1. User opens `/verify`.
2. Connects EVM wallet.
3. Signs terms:
   - no fabricated evidence;
   - submit only evidence personally observed;
   - no private data unless task specifically requires it and user has rights to submit it;
   - evidence may be included in public or buyer-visible reports depending on task classification.
4. Profile created with wallet address.
5. Optional social handle for coordination.

### Evidence envelope

Use EIP-712 typed data:

```ts
const domain = {
  name: "Continuity Evidence",
  version: "1",
  chainId: 196,
}

const types = {
  Evidence: [
    { name: "taskId", type: "string" },
    { name: "incidentId", type: "string" },
    { name: "contentHash", type: "bytes32" },
    { name: "statementHash", type: "bytes32" },
    { name: "submittedAt", type: "uint256" }
  ]
}
```

Store:

- original statement;
- statement hash;
- content hash;
- signature;
- recovered signer;
- timestamp.

### Evidence review

Each evidence submission gets:

- `signatureValid`
- `taskMatchesIncident`
- `hashMatchesContent`
- `deadlineMet`
- `manualReviewStatus`
- `reviewerNotes`

Only accepted evidence may influence the final verdict.

## 10. Reliability scoring

MVP score out of 100.

Inputs:

- Endpoint reachable: 20 points.
- Response matches declared schema: 15 points.
- Payment flow behaves correctly: 15 points.
- No open critical incidents: 20 points.
- Delivery evidence ratio: 15 points.
- Recovery behavior: 15 points.

Statuses:

- `90-100`: `HEALTHY`
- `75-89`: `WATCHLIST`
- `50-74`: `DEGRADED`
- `25-49`: `HIGH_RISK`
- `0-24`: `UNAVAILABLE`

Never overclaim. If data is insufficient, return `INCONCLUSIVE` with confidence.

## 11. UI plan

The first screen must be the product, not a landing page.

### Main dashboard

Layout:

- Left rail:
  - Agents
  - Incidents
  - Evidence Tasks
  - Records
  - API
- Main area:
  - Search/add agent input.
  - Status cards.
  - Open incidents table.
  - Recent records.

Tone:

- Institutional.
- High signal.
- No cartoon funeral visual language.
- No cards inside cards.
- Compact dashboard, not marketing hero.

### Public Continuity Record page

URL:

```text
/records/:recordId
```

Sections:

1. Header:
   - verdict badge;
   - agent name;
   - record type;
   - created timestamp;
   - record hash.
2. Summary:
   - root cause;
   - impact;
   - confidence.
3. Evidence:
   - evidence count;
   - accepted/rejected split;
   - signed verifier wallet addresses, truncated;
   - hashes.
4. Recommended actions:
   - refund/redelivery/retry/replacement/monitor.
5. Machine-readable JSON:
   - copy/download.

### Evidence task page

URL:

```text
/evidence-tasks/:taskId
```

Flow:

1. Show task instructions.
2. Connect wallet.
3. Submit statement and optional file/link.
4. App computes hash.
5. User signs evidence envelope.
6. Submission accepted.

## 12. Smart contract plan

Optional but high-impact if time permits.

Contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ContinuityRegistry {
    event IncidentAnchored(bytes32 indexed incidentHash, string publicUri, address indexed anchor);
    event EvidenceAnchored(bytes32 indexed evidenceHash, string evidenceUri, address indexed anchor);
    event RecordAnchored(bytes32 indexed recordHash, string publicUri, address indexed anchor);

    function anchorIncident(bytes32 incidentHash, string calldata publicUri) external {
        emit IncidentAnchored(incidentHash, publicUri, msg.sender);
    }

    function anchorEvidence(bytes32 evidenceHash, string calldata evidenceUri) external {
        emit EvidenceAnchored(evidenceHash, evidenceUri, msg.sender);
    }

    function anchorRecord(bytes32 recordHash, string calldata publicUri) external {
        emit RecordAnchored(recordHash, publicUri, msg.sender);
    }
}
```

Rules:

- No private data onchain.
- Only hashes and URIs.
- If deployment creates friction, skip contract and do not pretend anchoring exists.

## 13. Demo plan

90-second script:

1. "OKX.AI lets agents work, get paid, and build reputation. Continuity answers the operational question: what happens when an agent fails?"
2. Show dashboard with two agents:
   - healthy research ASP;
   - disputed booking/fulfillment ASP.
3. Run `check_agent_status` on a real endpoint.
4. Open an incident for failed delivery.
5. Request human evidence.
6. Submit real signed evidence from a verifier wallet.
7. Issue Continuity Record:
   - verdict: `DELIVERY_NOT_VERIFIED`;
   - root cause: unverified external fulfillment;
   - recommended actions: refund/redelivery, require external confirmation, monitor.
8. Show public record URL and JSON.
9. Close:
   - "Continuity gives agent commerce a recovery layer."

Demo data must be real:

- Use a real deployed endpoint for the healthy agent.
- Use a real intentionally failing endpoint or a real service interaction that actually fails.
- Human evidence must be signed by a real wallet.
- If payment is shown, use real OKX x402 `402 Payment Required`.

## 14. X post plan

Draft:

```text
Agents on OKX.AI can now work, get paid, and build reputation.

But autonomous commerce needs recovery when agents fail.

We built Continuity: evidence and recovery rails for OKX.AI agents.

It monitors ASPs, opens incidents, coordinates signed human evidence, and publishes recovery-ready reliability records.

Every agent economy needs continuity.

#OKXAI
```

Video must be <= 90 seconds.

## 15. Build sequence

### Phase 1: Repo and API skeleton

1. Create repo `continuity`.
2. Initialize pnpm or npm workspace.
3. Create `apps/api`.
4. Add TypeScript, Express, Zod, DB package.
5. Add `/health`.
6. Add `.env.example`.
7. Add request ID middleware.
8. Add structured error handler.

Acceptance:

- `npm run dev` starts API.
- `curl /health` returns JSON.

### Phase 2: Database

1. Create schema for agents, probes, incidents, evidence_tasks, evidence_submissions, records.
2. Implement `db.ts`.
3. Implement migration runner.
4. Add seed script only for local development; label it clearly as local seed.
5. No seed data in production demo unless created live.

Acceptance:

- DB file created.
- Tables exist.
- CRUD service unit tests pass.

### Phase 3: Agent status endpoint

1. Implement SSRF-safe URL validator.
2. Implement HTTP probe.
3. Measure latency.
4. Store probe.
5. Return status and score.

Acceptance:

- Real public URL works.
- `localhost`, `127.0.0.1`, `169.254.169.254`, private IPs rejected.

### Phase 4: Incident intake

1. Implement `POST /v1/open-incident`.
2. Validate incident type/severity.
3. Persist incident.
4. Generate public slug.
5. Create public incident page route in web app or API JSON.

Acceptance:

- Can open incident from curl.
- Public incident URL resolves.

### Phase 5: Human evidence

1. Implement evidence task creation.
2. Implement verifier onboarding page.
3. Implement wallet connect/sign flow.
4. Implement EIP-712 evidence signature.
5. Implement submission endpoint.
6. Verify recovered signer matches wallet.
7. Store evidence hash and signature.

Acceptance:

- A real wallet signs evidence.
- API verifies signature.
- Evidence appears in incident view.

### Phase 6: Continuity Record generation

1. Implement deterministic record generator.
2. It must use only accepted evidence and probe data.
3. It must include confidence.
4. It must avoid defamatory language.
5. Store JSON and hash.
6. Render public record page.

Acceptance:

- Record JSON reproducibly hashes to stored hash.
- Public record is shareable.

### Phase 7: OKX x402 paid routes

1. Reopen OKX seller docs.
2. Install exact package versions.
3. Create `payments/okxX402.ts`.
4. Configure `OKXFacilitatorClient`.
5. Configure `x402ResourceServer`.
6. Register `ExactEvmScheme` on `eip155:196`.
7. Protect paid endpoints.
8. Call `resourceServer.initialize()` after server start.
9. Verify unpaid call returns `402 Payment Required`.

Acceptance:

- Unpaid protected endpoint returns `402`.
- Free endpoints still work.
- No secrets logged.

### Phase 8: A2MCP listing preparation

Prepare service metadata:

- Name: `Continuity Reliability API`
- Category: Software Utility
- Description: "Reliability, evidence, and recovery API for OKX.AI agents. Check agent status, open incidents, request signed human evidence, and issue continuity records."
- Price:
  - `check_agent_status`: `$0.01`
  - `open_incident`: `$0.05`
  - `request_human_evidence`: `$0.05` platform fee
  - `issue_continuity_record`: `$0.10`
- Endpoint: deployed public HTTPS URL.

### Phase 9: A2A listing preparation

Prepare service metadata:

- Name: `Continuity Investigation`
- Category: Software Utility
- Description: "Evidence-backed investigation and recovery packet for failed, unavailable, or disputed OKX.AI agent deliveries."
- Default price: `1 USDT`
- Deliverables:
  - Incident summary.
  - Automated probe results.
  - Human evidence summary if requested.
  - Continuity Record URL.
  - Dispute/arbitration evidence packet.

### Phase 10: Register and list on OKX.AI

Prerequisites:

- Onchain OS installed.
- Agentic Wallet logged in.
- OKX API credentials available if needed.
- Public API deployed.

Commands/prompts:

1. `npx skills add okx/onchainos-skills --yes -g`
2. `Help me register an A2MCP ASP on OKX.AI using Onchain OS`
3. Provide service name, description, price, endpoint.
4. `Help me register an A2A ASP on OKX.AI using Onchain OS`
5. Provide A2A service list and default pricing.
6. `Help me list my ASP on OKX.AI using Onchain OS`

Acceptance:

- Listing submitted.
- Review email/agent notification received.
- If approved, marketplace URL captured.
- If rejected, revise exactly according to review feedback.

### Phase 11: Demo and submission

1. Record 90-second demo.
2. Post to X with #OKXAI.
3. Include:
   - ASP intro.
   - use case.
   - demo/walkthrough.
4. Submit Google form before July 17, 2026 23:59 UTC.
5. Include ASP details and X post link.

## 16. Risk register

| Risk | Mitigation |
|---|---|
| OKX ASP review delays | Submit early. Demo public endpoint and state review status truthfully. |
| Payment SDK friction | Build free endpoint first, then add x402. Do not block core product on payment. |
| x402 credentials missing | Use real free A2MCP mode temporarily; do not fake paid calls. |
| Human evidence feels operationally heavy | Use narrow verifier pool for hackathon; evidence tasks are real but small. |
| Product sounds accusatory | Use neutral verdicts and professional language. Avoid "fraud" unless proven. |
| Privacy leakage | Hash evidence, redact sensitive data, avoid public personal details. |
| SSRF via agent endpoint checks | Strict URL validation and blocked IP ranges. |
| Defamation / public shaming | Records say "not verified" or "unavailable," not insults. Provide confidence and appeal/recovery path. |
| Too broad | MVP focuses on failed delivery and endpoint availability only. |

## 17. MVP scope cut line

Must have:

- Public API.
- `check_agent_status`.
- `open_incident`.
- `request_human_evidence`.
- `submit_evidence` with real signature verification.
- `issue_continuity_record`.
- Public record page.
- OKX A2MCP listing attempt.
- X post demo.

Should have:

- x402 paid protection on at least one endpoint.
- A2A listing attempt.
- Evidence task UI.
- Dashboard.

Nice to have:

- X Layer hash anchoring contract.
- Replacement agent discovery.
- Automated behavioral drift checks.
- Multiple verifier consensus.

Do not build before MVP:

- Full insurance.
- Full court/arbitration protocol.
- Token incentives.
- Large open worker marketplace.
- Complex AI model scoring.

## 18. Copy bank

### Professional one-liner

Continuity provides reliability, evidence, and recovery rails for autonomous agents on OKX.AI.

### Stronger one-liner

Continuity is the incident and recovery layer for agent commerce.

### Problem

Agents can now take work, call APIs, and receive payments. But when an agent fails, disappears, or delivers unverifiable output, buyers need evidence, recovery, and a reliable public record.

### Solution

Continuity monitors agent availability, opens structured incidents, coordinates signed human evidence, and publishes recovery-ready reliability records.

### Demo closing line

OKX.AI gives agents a marketplace. Continuity gives that marketplace a recovery layer.

## 19. Immediate next actions

1. Create the repo.
2. Implement API skeleton.
3. Implement database schema.
4. Implement `check_agent_status`.
5. Implement incident intake.
6. Implement evidence signing.
7. Implement continuity records.
8. Deploy public API and dashboard.
9. Add OKX x402 payment protection.
10. Register/list ASP.
11. Record demo.
12. Post on X.
13. Submit hackathon form.

