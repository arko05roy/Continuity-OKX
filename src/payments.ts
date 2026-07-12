import { isAddress } from "viem";
import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { withX402, x402ResourceServer } from "@okxweb3/x402-next";
import type { NextRequest, NextResponse } from "next/server";

export const OKX_NETWORK = "eip155:196" as const;
export const OKX_USDT0 = "0x779ded0c9e1022225f8e0630b35a9b54be713736" as const;

export function a2mcpMode(): "free" | "paid" | "invalid" {
  const mode = (process.env.A2MCP_MODE ?? "free").trim().toLowerCase();
  return mode === "free" || mode === "paid" ? mode : "invalid";
}

type PaidHandler = (request: NextRequest) => Promise<NextResponse>;
type PaidRoute = Parameters<typeof withX402>[1];

export function paymentReadiness() {
  const missing: string[] = [];
  for (const name of ["OKX_API_KEY", "OKX_SECRET_KEY", "OKX_PASSPHRASE", "PAY_TO", "PUBLIC_BASE_URL"]) {
    if (!process.env[name]) missing.push(name);
  }
  if (process.env.PAY_TO && !isAddress(process.env.PAY_TO)) missing.push("PAY_TO must be a valid EVM address");
  if (process.env.PUBLIC_BASE_URL) {
    try {
      if (new URL(process.env.PUBLIC_BASE_URL).protocol !== "https:") missing.push("PUBLIC_BASE_URL must use HTTPS");
    } catch { missing.push("PUBLIC_BASE_URL must be a valid URL"); }
  }
  return { ready: missing.length === 0, missing };
}

function paymentServer() {
  const readiness = paymentReadiness();
  if (!readiness.ready) throw new Error(`Paid payment configuration is incomplete: ${readiness.missing.join(", ")}`);
  const facilitator = new OKXFacilitatorClient({
    apiKey: process.env.OKX_API_KEY!, secretKey: process.env.OKX_SECRET_KEY!, passphrase: process.env.OKX_PASSPHRASE!,
  });
  return new x402ResourceServer(facilitator).register(OKX_NETWORK, new ExactEvmScheme());
}

export function paidRoute(handler: PaidHandler, route: PaidRoute): PaidHandler {
  const mode = a2mcpMode();
  if (mode === "free") return handler;
  if (mode === "invalid") {
    return async () => {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: "A2MCP_MODE must be either free or paid" }, { status: 503 });
    };
  }
  const readiness = paymentReadiness();
  if (!readiness.ready) {
    return async () => {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: "Paid endpoint is not configured", missing: readiness.missing }, { status: 503 });
    };
  }
  return withX402(handler, route, paymentServer(), undefined, undefined, true);
}

export function paidRouteConfig(path: string, price: string, description: string): PaidRoute {
  return {
    accepts: { scheme: "exact", price, network: OKX_NETWORK, payTo: process.env.PAY_TO!, maxTimeoutSeconds: 300 },
    resource: `${process.env.PUBLIC_BASE_URL!.replace(/\/+$/, "")}${path}`,
    description,
    mimeType: "application/json",
  } as PaidRoute;
}
