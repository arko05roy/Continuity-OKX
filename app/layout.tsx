import type { Metadata } from "next";
import { Azeret_Mono, Manrope } from "next/font/google";
import "./globals.css";

const body = Manrope({ subsets: ["latin"], variable: "--font-body" });
const mono = Azeret_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "Continuity — incident response for AI agents", description: "Detect the slip. Verify the facts. Direct the recovery." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${body.variable} ${mono.variable}`}><body><a className="skip-link" href="#main-content">Skip to main content</a>{children}</body></html>;
}
