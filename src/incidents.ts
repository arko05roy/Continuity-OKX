import { z } from "zod";
import { assertSafeEndpoint } from "./probe";

export const incidentTypes = [
  "UNAVAILABLE", "FAILED_DELIVERY", "DISPUTED_DELIVERY", "POLICY_BREACH",
  "PAYMENT_FAILURE", "SECURITY_RISK", "FRAUD_CLAIM", "RECOVERY_REQUEST",
] as const;

export const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const requestedOutcomes = ["REFUND", "REDELIVERY", "WARNING", "SUSPENSION", "REPLACEMENT", "RECORD_ONLY"] as const;

export const evidenceTaskTypes = [
  "CALL_BUSINESS", "VISIT_URL", "VERIFY_SCREENSHOT", "VERIFY_DELIVERY", "LOCATION_CHECK",
  "DOCUMENT_CHECK", "MANUAL_QA", "MERCHANT_STATUS", "CUSTOM",
] as const;

export const evidenceTypes = ["TEXT", "URL", "SCREENSHOT", "PHOTO", "AUDIO", "VIDEO", "JSON", "HTTP_TRACE", "TX_HASH"] as const;

export const requestEvidenceTask = z.object({
  incidentId: z.string().uuid(),
  taskType: z.enum(evidenceTaskTypes),
  instructions: z.string().trim().min(1).max(10_000),
  rewardAmount: z.string().regex(/^\d{1,24}(\.\d{1,18})?$/, "rewardAmount must be a non-negative decimal amount").refine((value) => Number(value) >= 0, "rewardAmount must be non-negative"),
  rewardToken: z.string().trim().min(1).max(32),
  deadlineMinutes: z.number().int().min(1).max(10_080),
}).strict();

export const submitEvidenceRequest = z.object({
  taskId: z.string().uuid(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "walletAddress must be an EVM address"),
  statement: z.string().trim().min(1).max(20_000),
  evidenceType: z.enum(evidenceTypes),
  content: z.string().max(1_000_000).optional(),
  contentUri: z.string().url().optional(),
  contentHash: z.string().regex(/^[a-fA-F0-9]{64}$/, "contentHash must be a SHA-256 hex digest").optional(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "signature must be a hexadecimal signature"),
  signedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, ctx) => {
  if (value.content && value.contentUri) ctx.addIssue({ code: "custom", path: ["content"], message: "Provide content or contentUri, not both" });
  if (!value.content && !value.contentUri && value.evidenceType !== "TEXT") ctx.addIssue({ code: "custom", path: ["contentUri"], message: "Non-text evidence requires content or contentUri" });
  if (value.contentUri && !value.contentHash) ctx.addIssue({ code: "custom", path: ["contentHash"], message: "contentHash is required when contentUri is supplied" });
});

export const openIncidentRequest = z.object({
  agentName: z.string().trim().min(1).max(200),
  agentId: z.string().trim().min(1).max(200).optional(),
  endpointUrl: z.string().url().optional(),
  openedBy: z.string().trim().min(1).max(200),
  incidentType: z.enum(incidentTypes),
  severity: z.enum(severities),
  claim: z.string().trim().min(1).max(10_000),
  requestedOutcome: z.enum(requestedOutcomes),
  evidenceUrls: z.array(z.string().url()).max(50).default([]),
}).strict();

export async function validateIncidentUrls(input: z.infer<typeof openIncidentRequest>) {
  if (input.endpointUrl) await assertSafeEndpoint(input.endpointUrl);
  for (const evidenceUrl of input.evidenceUrls) {
    const url = new URL(evidenceUrl);
    if (url.protocol !== "https:") throw new Error("evidenceUrls must use HTTPS");
  }
}
