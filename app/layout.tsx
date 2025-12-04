import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORZA",
  description: "AI-powered football hub: matches, insights, slips & community.",
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}
      >
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900" />
        <div className="fixed inset-x-0 -z-10 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_60%)]" />

        {/* App Shell with auth gate */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
