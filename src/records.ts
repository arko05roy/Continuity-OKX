import crypto from "node:crypto";
import type { EvidenceSubmissionRecord, IncidentRecord } from "./db";

export const recordTypes = ["STATUS_RECORD", "INCIDENT_RECORD", "RECOVERY_RECORD", "RELIABILITY_PROFILE"] as const;
export type RecordType = (typeof recordTypes)[number];

export type GeneratedContinuityRecord = {
  verdict: "DELIVERY_NOT_VERIFIED" | "DELIVERY_VERIFIED" | "INCONCLUSIVE" | "UNAVAILABLE" | "COMPROMISED" | "RESTORED";
  rootCause: string;
  impactSummary: string;
  evidenceSummary: Record<string, unknown>;
  recommendedActions: string[];
  replacementServices: string[];
};

function acceptedEvidence(submissions: EvidenceSubmissionRecord[]) {
  return submissions.filter((submission) =>
    submission.reviewStatus === "ACCEPTED" && submission.signatureValid && submission.contentHashMatched !== false,
  );
}

export function generateContinuityRecord(incident: IncidentRecord, submissions: EvidenceSubmissionRecord[]): GeneratedContinuityRecord {
  const accepted = acceptedEvidence(submissions);
  const hasAcceptedEvidence = accepted.length > 0;
  const isUnavailable = incident.incidentType === "UNAVAILABLE";
  const isSecurityRisk = incident.incidentType === "SECURITY_RISK";
  const isRestored = incident.status === "RESTORED";
  const verdict = isSecurityRisk ? "COMPROMISED" : isRestored ? "RESTORED" : isUnavailable ? "UNAVAILABLE" :
    hasAcceptedEvidence ? (incident.incidentType === "DISPUTED_DELIVERY" || incident.incidentType === "FAILED_DELIVERY" ? "DELIVERY_NOT_VERIFIED" : "INCONCLUSIVE") : "INCONCLUSIVE";

  const recommendedActions = incident.requestedOutcome === "REFUND"
    ? ["Review refund eligibility against the accepted evidence", "Require external confirmation before future settlement"]
    : incident.requestedOutcome === "REDELIVERY"
      ? ["Request a verified redelivery", "Require external confirmation before future settlement"]
      : incident.requestedOutcome === "REPLACEMENT"
        ? ["Evaluate a replacement service", "Preserve this record for marketplace reliability review"]
        : ["Preserve this record for marketplace reliability review", "Collect additional signed evidence before changing the incident outcome"];

  return {
    verdict,
    rootCause: hasAcceptedEvidence
      ? `Incident claim supported by ${accepted.length} accepted signed evidence submission${accepted.length === 1 ? "" : "s"}.`
      : "No accepted signed evidence is available for this incident; the reported cause remains unverified.",
    impactSummary: incident.claim,
    evidenceSummary: {
      incidentEvidenceUrls: incident.evidenceUrls,
      totalSubmissions: submissions.length,
      acceptedSubmissions: accepted.length,
      pendingSubmissions: submissions.filter((submission) => submission.reviewStatus === "PENDING").length,
      rejectedSubmissions: submissions.filter((submission) => submission.reviewStatus === "REJECTED").length,
      signedVerifiers: accepted.map((submission) => submission.submittedByWallet),
      hashes: accepted.map((submission) => submission.contentHash),
    },
    recommendedActions,
    replacementServices: [],
  };
}

export function hashRecord(record: GeneratedContinuityRecord & { incidentId: string; agentName: string; recordType: RecordType }) {
  return crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
}
