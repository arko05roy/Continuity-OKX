"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";

export default function ShareRecordButton({ agentName, verdict }: { agentName: string; verdict: string }) {
  const [label, setLabel] = useState("Share recovery record");
  async function share() {
    const data = { title: `${agentName} · Continuity Record`, text: `${agentName}: ${verdict.replaceAll("_", " ")} — verified through Continuity.`, url: window.location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(window.location.href); setLabel("Record link copied"); } }
    catch { setLabel("Share cancelled"); }
  }
  return <button className="button-primary" onClick={() => void share()}><ShareNetwork aria-hidden="true" />{label}</button>;
}
