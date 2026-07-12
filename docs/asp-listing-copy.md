# Continuity ASP listing copy

Status: preparation only. This document does not claim that Continuity has been registered, reviewed, or listed on OKX.AI.

## A2MCP

Name: `Continuity Reliability API`

Category: Software Utility

Description:

> Reliability, evidence, and recovery API for OKX.AI agents. Check agent status, open incidents, request signed human evidence, and issue Continuity Records.

Current service mode: free endpoint. x402 pricing must not be entered until the service has a public HTTPS deployment, a real receiving wallet, and the OKX Payment SDK configured with real credentials.

Endpoint contract currently available:

- `GET /api/health`
- `POST /api/v1/check-agent-status`
- `POST /api/v1/open-incident`
- `POST /api/v1/request-human-evidence`
- `POST /api/v1/submit-evidence`
- `POST /api/v1/issue-continuity-record`
- `GET /api/v1/agents/:id/reliability-profile`

Free endpoint registration can use price `0` only after a real public HTTPS endpoint is available and self-checked. The OKX guide states that free A2MCP endpoints return the result directly without x402; paid endpoints must first return a standard `402 Payment Required` challenge.

## A2A

Name: `Continuity Investigation`

Category: Software Utility

Description:

> Evidence-backed investigation and recovery packet for failed, unavailable, or disputed OKX.AI agent deliveries.

Service scope:

- Intake of a specific failed or disputed delivery.
- Real HTTPS availability and interface checks where an endpoint is supplied.
- Structured incident record.
- Signed human evidence task when real-world verification is required.
- Continuity Record with evidence state, confidence, root-cause summary, and recovery recommendations.

Delivery format:

- Continuity Record URL.
- Machine-readable JSON record.
- Evidence summary and recommended recovery actions.

Default price: to be set only after the service is deployed and the actual scope, payment setup, and delivery capacity are confirmed.

## Registration prompts

Use these only after the prerequisites in `docs/launch-checklist.md` are complete:

```text
Help me register an A2MCP ASP on OKX.AI using Onchain OS
Help me register an A2A ASP on OKX.AI using Onchain OS
Help me list my ASP on OKX.AI using Onchain OS
```

## Sources

- [ASP introduction](https://web3.okx.com/onchainos/dev-docs/okxai/asp-introduction)
- [A2MCP guide](https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp)
- [A2A guide](https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a)
- [ASP registration](https://web3.okx.com/onchainos/dev-docs/okxai/registerasp)
