"use client";

import { useState } from "react";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

type Props = { task: { id: string; incidentId: string } };
const evidenceTypes = [{ name: "taskId", type: "string" }, { name: "incidentId", type: "string" }, { name: "contentHash", type: "bytes32" }, { name: "statementHash", type: "bytes32" }, { name: "submittedAt", type: "uint256" }];

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function EvidenceSubmissionForm({ task }: Props) {
  const [statement, setStatement] = useState("");
  const [content, setContent] = useState("");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function connectWallet() {
    setMessage(null);
    if (!window.ethereum) { setMessage({ type: "error", text: "No browser EVM wallet was detected." }); return; }
    try {
      let chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xc4") {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xc4" }] });
        chainId = await window.ethereum.request({ method: "eth_chainId" });
      }
      if (chainId !== "0xc4") { setMessage({ type: "error", text: "Your wallet did not switch to X Layer mainnet (chain ID 196)." }); return; }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
      if (!address) throw new Error("The wallet did not return an address.");
      setWallet(address);
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Wallet connection failed." }); }
  }

  async function submit() {
    setMessage(null);
    const normalizedStatement = statement.trim();
    if (!normalizedStatement) { setMessage({ type: "error", text: "Enter the observation before signing." }); return; }
    if (!wallet) { setMessage({ type: "error", text: "Connect an X Layer wallet before signing." }); return; }
    if (!window.ethereum) { setMessage({ type: "error", text: "No browser EVM wallet was detected." }); return; }
    setBusy(true);
    try {
      const signedAt = new Date().toISOString();
      const contentHash = await sha256(content || normalizedStatement);
      const statementHash = await sha256(normalizedStatement);
      const submittedAt = Math.floor(Date.parse(signedAt) / 1000).toString();
      const typedData = { domain: { name: "Continuity Evidence", version: "1", chainId: 196 }, types: { Evidence: evidenceTypes }, primaryType: "Evidence", message: { taskId: task.id, incidentId: task.incidentId, contentHash: `0x${contentHash}`, statementHash: `0x${statementHash}`, submittedAt } };
      const signature = await window.ethereum.request({ method: "eth_signTypedData_v4", params: [wallet, JSON.stringify(typedData)] });
      if (typeof signature !== "string") throw new Error("The wallet did not return a signature.");
      const response = await fetch("/api/v1/submit-evidence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ taskId: task.id, walletAddress: wallet, statement: normalizedStatement, evidenceType: "TEXT", ...(content ? { content } : {}), signature, signedAt }) });
      const result = await response.json() as { submissionId?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Evidence submission failed.");
      setMessage({ type: "success", text: `Submission ${result.submissionId} is pending review. It has not been auto-accepted.` });
      setStatement(""); setContent("");
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Evidence submission failed." }); }
    finally { setBusy(false); }
  }

  return <section className="submission-form"><div className="wallet-row"><div><span className="kicker">SIGNING WALLET</span><strong>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Not connected"}</strong><small>Message signature · no gas fee</small></div><button className="button-secondary" onClick={() => void connectWallet()} disabled={busy}>{wallet ? "Reconnect" : "Connect X Layer wallet"}</button></div><label><span>What did you observe?</span><textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="State only what you personally observed. Avoid conclusions you cannot verify." maxLength={20000} /></label><label><span>Supporting text <small>optional</small></span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Included text is hashed before signing." maxLength={1000000} /></label><button className="button-primary" onClick={() => void submit()} disabled={busy}>{busy ? "Signing evidence…" : "Sign and send for review"}</button>{message ? <p className={`form-message ${message.type}`} role="status">{message.text}</p> : null}</section>;
}
