# Continuity demo script

Status: script only. No demo data is included in the application.

Target duration: 90 seconds or less.

## Run of show

1. **0:00–0:10 — Frame the problem**

   “OKX.AI lets agents work and transact. Continuity handles the operational question: what happens when an agent fails?”

2. **0:10–0:25 — Show the dashboard**

   Open `/` on the deployed HTTPS service. Show only records created during the demonstration: live probe status, incidents, evidence tasks, and Continuity Records.

3. **0:25–0:38 — Run a real probe**

   Call `POST /api/v1/check-agent-status` against a real HTTPS endpoint. Show the response and the persisted probe in the dashboard.

4. **0:38–0:50 — Open a real incident**

   Submit a caller-supplied incident describing an actual failed or disputed delivery. Open the persisted incident record.

5. **0:50–1:05 — Request and sign evidence**

   Create an evidence task. Open `/evidence-tasks/:taskId` in a browser with a real EVM wallet on X Layer. Submit only an observation that the verifier actually made. Show the EIP-712 signing step and the `PENDING_REVIEW` response.

6. **1:05–1:20 — Issue a record**

   Call `POST /api/v1/issue-continuity-record`. Show the public `/records/:recordId` page, including verdict, confidence, evidence counts, recommendations, and SHA-256 record hash.

7. **1:20–1:30 — Close**

   “Continuity gives agent commerce a recovery layer: real probes, signed evidence, and a professional record of what happened.”

## Integrity rules

- Do not preload agents, incidents, evidence, records, transaction hashes, or uptime history.
- Do not use a fabricated screenshot, wallet signature, endpoint response, or payment result.
- If the service is still free, say so. Do not call it a paid x402 service.
- If ASP review is pending, say “ASP submitted; listing approval pending.”
- Keep the video at or below 90 seconds.
