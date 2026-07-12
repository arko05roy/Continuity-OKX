# Continuity

Reliability, evidence, and recovery infrastructure for OKX.AI agents.

## Current slice

The API currently exposes free A2MCP-compatible endpoints through Next.js route handlers:

- `POST /api/v1/check-agent-status` makes a real HTTPS request to the supplied endpoint, validates the target against common SSRF destinations, and persists the resulting probe in Neon Postgres.
- `POST /api/v1/open-incident` validates caller-supplied incident details and persists a real incident record.
- `GET /api/v1/incidents/:id` retrieves an incident by its UUID or generated public slug.
- `POST /api/v1/request-human-evidence` creates a real evidence task attached to a persisted incident.
- `GET /api/v1/evidence-tasks/:id` retrieves a persisted evidence task for a verifier.
- `POST /api/v1/submit-evidence` verifies an EIP-712 evidence signature against the submitting wallet, computes SHA-256 hashes for server-supplied content, and persists the submission for review.
- `POST /api/v1/issue-continuity-record` generates and persists a record from the incident and its persisted evidence submissions; only accepted, valid signed evidence can affect the verdict.
- `GET /api/v1/records/:id` retrieves a persisted Continuity Record.
- `GET /api/v1/dashboard` aggregates persisted probes, incidents, evidence tasks, and records for the operational dashboard.
- `GET /api/v1/agents/:id/reliability-profile` returns a profile derived from persisted records; it reports `INCONCLUSIVE` with a null score when the available evidence is insufficient.
- `/records/:recordId` renders a public Continuity Record from persisted data, including confidence, evidence counts, recommendations, and the stored SHA-256 hash.
- `/evidence-tasks/:taskId` provides a real browser-wallet EIP-712 signing flow for text evidence on X Layer; submissions remain pending review.

No records are seeded, and no payment is enabled.

The dashboard at `/` is data-backed. With no `DATABASE_URL` or no persisted records, it shows a connection error or a deliberate empty state rather than demo agents or simulated history.

```bash
npm install
npm run build
npm test
npm run dev
```

Set `DATABASE_URL` to a real Neon connection string before using the probe route. Use a real HTTPS endpoint when probing. Payment is not enabled yet; do not describe this local service as a paid x402 service until the OKX SDK is configured with real credentials and a public HTTPS deployment.

The implementation decisions are tracked in [`agents.md`](agents.md) and the product plan in [`plan.md`](plan.md).

Launch and marketplace preparation material is in [`docs/`](docs/), including listing copy, the demo script, and an external-state launch checklist. These documents do not represent completed registration, payment, deployment, or approval.

Evidence submissions are not fabricated or auto-accepted. Text/content supplied in the request is hashed by the server; externally hosted content is accepted only with its caller-supplied SHA-256 digest and remains unverified until review. The EIP-712 domain is `Continuity Evidence`, version `1`, on X Layer chain ID `196`.
