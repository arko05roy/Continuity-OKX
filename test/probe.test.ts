import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeEndpoint, sha256Text } from "../src/probe";
import { openIncidentRequest, requestEvidenceTask, submitEvidenceRequest } from "../src/incidents";
import { generateContinuityRecord, hashRecord } from "../src/records";
import { buildReliabilityProfile } from "../src/reliability";
import { a2aInvestigationRequest, quoteFitsBudget, transitionA2A } from "../src/a2a";

test("rejects non-HTTPS endpoints", async () => {
  await assert.rejects(() => assertSafeEndpoint("http://example.com"), /HTTPS/);
});

test("rejects loopback endpoints", async () => {
  await assert.rejects(() => assertSafeEndpoint("https://127.0.0.1"), /private or local/);
});

test("requires caller-supplied incident details", () => {
  const result = openIncidentRequest.safeParse({
    agentName: "Booking agent",
    openedBy: "0xcaller",
    incidentType: "FAILED_DELIVERY",
    severity: "HIGH",
    claim: "The delivery was not completed.",
    requestedOutcome: "REDELIVERY",
  });
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data.evidenceUrls, []);
});

test("rejects unsupported incident values", () => {
  const result = openIncidentRequest.safeParse({
    agentName: "Booking agent",
    openedBy: "0xcaller",
    incidentType: "MADE_UP",
    severity: "HIGH",
    claim: "A real claim.",
    requestedOutcome: "REDELIVERY",
  });
  assert.equal(result.success, false);
});

test("evidence task requires a real incident and bounded deadline", () => {
  const result = requestEvidenceTask.safeParse({
    incidentId: "not-an-uuid", taskType: "MANUAL_QA", instructions: "Check the delivered result.",
    rewardAmount: "1.00", rewardToken: "USDT0", deadlineMinutes: 90,
  });
  assert.equal(result.success, false);
});

test("text evidence uses the raw UTF-8 SHA-256 digest", () => {
  assert.equal(sha256Text("observed"), "604cee807f644af47487bf2bbab442b94212ac5119f36f995f78e9e4694dae8c");
});

test("non-text evidence cannot omit its content reference", () => {
  const result = submitEvidenceRequest.safeParse({
    taskId: "00000000-0000-0000-0000-000000000000", walletAddress: "0x0000000000000000000000000000000000000000",
    statement: "Observed the result.", evidenceType: "SCREENSHOT", signature: "0x12", signedAt: "2026-07-12T00:00:00.000Z",
  });
  assert.equal(result.success, false);
});

test("record generation excludes pending and invalid evidence", () => {
  const incident = {
    id: "00000000-0000-0000-0000-000000000001", publicSlug: "INC-1", agentName: "Booking agent", agentId: null,
    endpointUrl: null, openedBy: "0xcaller", incidentType: "FAILED_DELIVERY", severity: "HIGH", status: "OPEN",
    claim: "The provider could not confirm the booking.", requestedOutcome: "REFUND", evidenceUrls: [],
    createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z",
  };
  const record = generateContinuityRecord(incident, [{
    id: "submission-1", incidentId: incident.id, submittedByWallet: "0x1", evidenceType: "TEXT", contentUri: null,
    contentHash: "a".repeat(64), statement: "Observed.", signature: "0x12", signedAt: incident.createdAt,
    signatureValid: true, contentHashMatched: true, reviewStatus: "PENDING", createdAt: incident.createdAt,
  }]);
  assert.equal(record.verdict, "INCONCLUSIVE");
  assert.equal(record.evidenceSummary.acceptedSubmissions, 0);
  assert.equal(hashRecord({ incidentId: incident.id, agentName: incident.agentName, recordType: "INCIDENT_RECORD", ...record }).length, 64);
});

test("reliability profile stays inconclusive when records are insufficient", () => {
  const profile = buildReliabilityProfile("Observed agent", [{
    id: "probe-1", agentName: "Observed agent", endpointUrl: "https://example.com", probeType: "UPTIME", status: "PASS",
    startedAt: "2026-07-12T00:00:00.000Z", completedAt: "2026-07-12T00:00:01.000Z", summary: "Reached endpoint.",
    statusCode: 200, latencyMs: 100, contentType: "application/json",
  }], [], []);
  assert.equal(profile.status, "INCONCLUSIVE");
  assert.equal(profile.continuityScore, null);
  assert.equal(profile.signals.uptime, "PASS");
  assert.equal(profile.signals.validatedRecords, 0);
});

test("A2A investigation requires a real budget and delivery instructions", () => {
  const result = a2aInvestigationRequest.safeParse({
    agentName: "Research agent", openedBy: "buyer-wallet", incidentType: "FAILED_DELIVERY", severity: "HIGH",
    claim: "The requested report was not delivered.", requestedOutcome: "REDELIVERY", budgetAmount: "1.00",
    budgetToken: "USDT0", deadlineMinutes: 120, deliveryInstructions: "Return a Continuity Record URL.",
  });
  assert.equal(result.success, true);
});

test("A2A quote and acceptance do not imply payment", () => {
  assert.equal(quoteFitsBudget("0.50", "1.00"), true);
  assert.equal(quoteFitsBudget("1.01", "1.00"), false);
  assert.equal(transitionA2A("REQUESTED", "QUOTE"), "QUOTED");
  assert.equal(transitionA2A("QUOTED", "ACCEPT"), "ACCEPTED_PENDING_PAYMENT");
  assert.equal(transitionA2A("ACCEPTED_PENDING_PAYMENT", "PAYMENT_VERIFIED"), "PAYMENT_VERIFIED");
});
