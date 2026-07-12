# Continuity project context

## Product

Continuity provides reliability, evidence, and recovery infrastructure for OKX.AI agents. Product language is institutional: incident, recovery, evidence, reliability, verifier, root cause, record, and restored.

## Current implementation

- This repository is being built in small, verifiable vertical slices.
- Slice 1 is a Next.js App Router application with TypeScript, route handlers, and Neon Postgres persistence.
- Implemented endpoint: `GET /api/health`.
- Implemented endpoint: `POST /api/v1/check-agent-status`.
- The status endpoint performs a real HTTPS probe and persists a real `ReliabilityProbe` record.
- Implemented endpoint: `POST /api/v1/open-incident`.
- Implemented endpoint: `GET /api/v1/incidents/:id`.
- Implemented endpoint: `POST /api/v1/request-human-evidence`.
- Implemented endpoint: `GET /api/v1/evidence-tasks/:id`.
- Implemented endpoint: `POST /api/v1/submit-evidence`.
- Implemented endpoint: `POST /api/v1/issue-continuity-record`.
- Implemented endpoint: `GET /api/v1/records/:id`.
- Implemented endpoint: `GET /api/v1/dashboard`.
- Implemented endpoint: `GET /api/v1/agents/:id/reliability-profile`.
- Implemented endpoint: `POST /api/v1/a2a/investigations` for real A2A investigation intake.
- Implemented endpoint: `GET /api/v1/a2a/investigations/:id` for persisted investigation state.
- Implemented endpoint: `POST /api/v1/a2a/investigations/:id/quote` for budget-bounded quote negotiation.
- Implemented endpoint: `POST /api/v1/a2a/investigations/:id/accept` for buyer acceptance pending verified payment.
- Implemented endpoint: `GET /api/v1/evidence-review/queue` for token-protected reviewer access.
- Implemented endpoint: `POST /api/v1/evidence-submissions/:id/review` for token-protected evidence acceptance/rejection.
- Implemented endpoint: `POST /api/v1/a2a/investigations/:id/payment-verified` for a trusted OKX payment-verification adapter handoff.
- Implemented endpoint: `POST /api/v1/a2a/investigations/:id/execute` for payment-gated real probe/evidence/record execution.
- Implemented endpoint: `POST /api/v1/a2a/investigations/:id/buyer-response` for trusted buyer delivery response recording.
- Implemented dashboard at `/` with real persisted-data views for agents, incidents, evidence tasks, and records.
- Implemented public record page at `/records/:recordId`.
- Implemented verifier page at `/evidence-tasks/:taskId` with real browser-wallet EIP-712 signing on X Layer.
- Incident intake validates caller-supplied fields with Zod, requires HTTPS evidence URLs, applies SSRF-safe validation to optional agent endpoints, and persists a real `Incident` record in Neon Postgres.
- Incident retrieval works by persisted incident UUID or generated public slug.
- Evidence tasks and submissions persist against real incidents in Neon Postgres. Text/content supplied in a submission is hashed server-side with SHA-256; externally hosted content requires a caller-supplied SHA-256 digest and remains pending review because the service does not pretend to have fetched or verified it.
- Evidence submissions verify the supplied EIP-712 signature against the caller-supplied EVM wallet using the Continuity Evidence domain on X Layer chain ID 196. Invalid signatures are persisted as pending review with `signatureValid: false`, never treated as accepted evidence.
- Continuity records include a confidence level and only accepted, valid, hash-matched evidence can affect their verdict; records without sufficient accepted evidence remain `INCONCLUSIVE`.
- There is no seed data, fake evidence, fake uptime history, fake transaction hash, or simulated payment.
- The official OKX Next.js x402 adapter is installed and paid protection is wired for status checks, incident opening, evidence-task requests, and record issuance. The deployed service returns genuine `402 Payment Required` challenges on X Layer; paid replay and settlement have not yet been verified with a real buyer wallet.
- A2A intake/quote/acceptance state is persisted, but acceptance remains `ACCEPTED_PENDING_PAYMENT`; no escrow, payment, delivery, or arbitration is simulated.

## External status that must remain explicit

- A2MCP paid replay/settlement: `UNVERIFIED` until a real buyer wallet pays and the endpoint returns the replayed result.
- A2MCP marketplace listing: `NOT SUBMITTED`; no OKX.AI approval or listing is claimed.
- A2A marketplace listing: `NOT SUBMITTED`; the negotiation/execution agent workflow is not yet ready to claim as live.
- Evidence review: reviewer queue and accept/reject workflow are implemented, but `REVIEWER_TOKEN` must be configured and a real reviewer action has not yet been exercised.

## Source-backed constraints

- A2MCP can be free or pay-per-call; paid routes must return a genuine x402 `402 Payment Required` challenge and replay after payment.
- OKX seller payment configuration is X Layer `eip155:196`, with USDT0 `0x779ded0c9e1022225f8e0630b35a9b54be713736` as the documented default token.
- Never commit or log `OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE`, or wallet secrets.
- Re-open the URLs in `plan.md` before implementing payment, listing, A2A, signing, or anchoring work.

## Next safe slices

1. Verify one real paid A2MCP replay/settlement with a buyer wallet.
2. Connect a real OKX A2A payment/escrow verification adapter using `A2A_EXECUTION_TOKEN`.
3. Exercise A2A execution and delivery with a real paid investigation and real accepted evidence.
4. Submit truthful A2MCP listing metadata through Onchain OS; register A2A only after its agent workflow can negotiate and deliver.
5. Record the demo and submit the hackathon materials using real endpoint activity and real signed evidence.

## Verification

- `npm run build`
- `npm test`
- Run locally with `npm run dev`; set `DATABASE_URL` to a real Neon database and use a real HTTPS endpoint as the probe target.
