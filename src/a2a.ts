import { z } from "zod";
import { incidentTypes, openIncidentRequest, requestedOutcomes, severities, validateIncidentUrls } from "./incidents";

export const a2aStatuses = [
  "REQUESTED", "QUOTED", "ACCEPTED_PENDING_PAYMENT", "PAYMENT_VERIFIED", "IN_PROGRESS",
  "EVIDENCE_REQUIRED", "DELIVERED", "ACCEPTED_BY_BUYER", "REJECTED_BY_BUYER", "CANCELLED",
] as const;
export const a2aPaymentStatuses = ["NOT_CONFIGURED", "PENDING", "VERIFIED", "SETTLED", "REJECTED"] as const;

const decimalAmount = z.string().regex(/^\d{1,24}(\.\d{1,18})?$/, "amount must be a non-negative decimal amount");
const positiveDecimalAmount = decimalAmount.refine((value) => value.split(".").some((part) => /[1-9]/.test(part)), "amount must be greater than zero");

export const a2aInvestigationRequest = openIncidentRequest.extend({
  budgetAmount: positiveDecimalAmount,
  budgetToken: z.string().trim().min(1).max(32),
  deadlineMinutes: z.number().int().min(1).max(10_080),
  deliveryInstructions: z.string().trim().min(1).max(20_000),
}).strict();

export const a2aQuoteRequest = z.object({
  quotedAmount: positiveDecimalAmount,
  quotedToken: z.string().trim().min(1).max(32),
  scope: z.string().trim().min(1).max(20_000),
  expiresInMinutes: z.number().int().min(1).max(10_080),
}).strict();

export const a2aBuyerResponse = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
  note: z.string().trim().min(1).max(20_000),
}).strict();

export type A2AStatus = (typeof a2aStatuses)[number];
export type A2AEvent = "QUOTE" | "ACCEPT" | "PAYMENT_VERIFIED" | "START" | "EVIDENCE_REQUIRED" | "DELIVER" | "BUYER_ACCEPT" | "BUYER_REJECT" | "CANCEL";

const transitions: Record<A2AStatus, Partial<Record<A2AEvent, A2AStatus>>> = {
  REQUESTED: { QUOTE: "QUOTED", CANCEL: "CANCELLED" },
  QUOTED: { ACCEPT: "ACCEPTED_PENDING_PAYMENT", QUOTE: "QUOTED", CANCEL: "CANCELLED" },
  ACCEPTED_PENDING_PAYMENT: { PAYMENT_VERIFIED: "PAYMENT_VERIFIED", CANCEL: "CANCELLED" },
  PAYMENT_VERIFIED: { START: "IN_PROGRESS", CANCEL: "CANCELLED" },
  IN_PROGRESS: { EVIDENCE_REQUIRED: "EVIDENCE_REQUIRED", DELIVER: "DELIVERED", CANCEL: "CANCELLED" },
  EVIDENCE_REQUIRED: { START: "IN_PROGRESS", DELIVER: "DELIVERED", CANCEL: "CANCELLED" },
  DELIVERED: { BUYER_ACCEPT: "ACCEPTED_BY_BUYER", BUYER_REJECT: "REJECTED_BY_BUYER" },
  ACCEPTED_BY_BUYER: {}, REJECTED_BY_BUYER: {}, CANCELLED: {},
};

export function transitionA2A(status: A2AStatus, event: A2AEvent): A2AStatus {
  const next = transitions[status][event];
  if (!next) throw new Error(`Cannot apply ${event} while investigation is ${status}`);
  return next;
}

function decimalUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(`${whole}${fraction.padEnd(18, "0")}`);
}

export function quoteFitsBudget(quotedAmount: string, budgetAmount: string) {
  return decimalUnits(quotedAmount) <= decimalUnits(budgetAmount);
}

export { incidentTypes, requestedOutcomes, severities, validateIncidentUrls };
