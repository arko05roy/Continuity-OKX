import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Continuity — Agent Production Safety", description: "Reliability, evidence, and recovery infrastructure for OKX.AI agents." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
