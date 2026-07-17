"use client";

import { Bell, CirclesFour, ClockCounterClockwise, Robot, ShieldCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Overview", icon: CirclesFour, id: "command" },
  { href: "/#incidents", label: "Incidents", icon: Bell, id: "incidents" },
  { href: "/#agents", label: "Agents", icon: Robot, id: "agents" },
  { href: "/review", label: "Evidence review", icon: ShieldCheck, id: "review" },
];

export default function CommandShell({ children, current, status = "Service online" }: { children: ReactNode; current: string; status?: string }) {
  return <div className="command-shell">
    <aside className="command-rail">
      <a className="command-brand" href="/" aria-label="Continuity home"><span className="command-brand-mark">C</span><span><strong>Continuity</strong><small>Agent operations</small></span></a>
      <nav aria-label="Primary navigation">{navigation.map(({ href, label, icon: Icon, id }) => <a className={current === id ? "is-current" : ""} href={href} key={id}><Icon aria-hidden="true" /><span>{label}</span></a>)}</nav>
      <footer><span className="rail-status-dot" /><span><strong>{status}</strong><small>Production workspace</small></span></footer>
    </aside>
    <div className="command-stage"><header className="mobile-commandbar"><a href="/">Continuity</a><span><ClockCounterClockwise /> {status}</span></header><main id="main-content">{children}</main></div>
  </div>;
}
