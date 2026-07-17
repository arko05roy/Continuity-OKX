export type RecoveryPolicy = "OBSERVE_ONLY" | "RETRY_AND_ESCALATE" | "AUTO_RECOVER";

export function resolveAdapterKey(endpointUrl: string, continuityOrigin: string): string | null {
  const endpoint = new URL(endpointUrl);
  const trustedOrigin = new URL(continuityOrigin);
  if (endpoint.origin !== trustedOrigin.origin) return null;
  return endpoint.pathname === "/api/agents/research-coordinator/health" ? "research-coordinator" : null;
}

export function canExecuteAutomaticRecovery(policy: string, adapterKey: string | null): boolean {
  return policy === "AUTO_RECOVER" && adapterKey === "research-coordinator";
}
