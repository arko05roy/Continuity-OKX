# Continuity launch gates

This checklist distinguishes repository readiness from external state. A checked code item does not imply deployment, payment activation, or OKX.AI approval.

## Repository

- [x] API health endpoint exists.
- [x] Real HTTPS probe validates SSRF-sensitive destinations and persists a probe.
- [x] Incident intake and retrieval persist real caller-supplied incidents.
- [x] Evidence task creation and retrieval persist against incidents.
- [x] EIP-712 evidence verification runs against the supplied wallet on X Layer chain ID 196.
- [x] Continuity Records persist deterministic SHA-256 hashes and confidence.
- [x] Dashboard reads persisted records and has explicit empty/error states.
- [x] Public record page renders persisted record data.
- [x] Verifier page signs real text evidence through a browser EVM wallet.
- [x] `npm run build` passes.
- [x] `npm test` passes.

## Required external setup

- [ ] Real Neon `DATABASE_URL` configured in the deployment environment.
- [ ] Public HTTPS deployment exists and serves the dashboard and API.
- [ ] Real HTTPS probe target is available for demonstration.
- [ ] Real verifier wallet is available on X Layer for evidence signing.
- [ ] If paid A2MCP is selected: real `OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE`, and seller wallet are configured outside the repository.
- [ ] If paid A2MCP is selected: OKX Payment SDK is initialized and unpaid calls return a genuine `402 Payment Required` challenge.
- [ ] A2MCP/A2A registration is submitted through Onchain OS.
- [ ] Marketplace review result is received and recorded truthfully.
- [ ] Demo is recorded with real activity and kept under 90 seconds.
- [ ] Hackathon submission and X post are completed before the published deadline.

## Do not mark complete without evidence

- Payment is not enabled by setting a price in documentation.
- Marketplace listing is not complete until the review result is received.
- Anchoring is not complete until a real X Layer transaction is submitted and verified.
- A2A delivery is not complete until a real task is accepted and delivered.
