"use client";

import { useState } from "react";
import type { ForzaSlip } from "@/lib/bookmakers/normalize-betpawa";
import SlipActions, { SlipBet } from "@/components/SlipActions";

type ImportState = "idle" | "loading" | "success" | "error";

export default function BetpawaBookingImport() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<ImportState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [slip, setSlip] = useState<ForzaSlip | null>(null);

  async function handleImport() {
    setStatus("loading");
    setError(null);
    setSlip(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setStatus("idle");
      setError("Enter a BetPawa booking code first.");
      return;
    }

    try {
      const res = await fetch("/api/slips/import-booking-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookmaker: "betpawa_tz",
          code: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "Failed to import code.");
        return;
      }

      setSlip(data.slip as ForzaSlip);
      setStatus("success");
    } catch (err) {
      console.error("[FORZA] BetPawa import fetch error:", err);
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  const hasSlip = !!slip;

  return (
    <section className="space-y-3 text-xs mt-2">
      <header className="space-y-1">
        <h1 className="text-base font-semibold text-white">
          Import from BetPawa
        </h1>
        <p className="text-[11px] text-[#9CA3AF]">
          Paste a BetPawa Tanzania booking code and FORZA will fetch all matches
          and odds for you.
        </p>
      </header>

      {/* Code input */}
      <div className="rounded-xl bg-[#111111] border border-[#262626] p-3 space-y-2">
        <label className="text-[11px] text-[#9CA3AF]">
          BetPawa booking code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ZSKM1GX"
          className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-1.5 text-[12px] text-white tracking-[0.08em]"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={status === "loading"}
          className="w-full bg-[#1F2937] text-white text-[12px] font-medium py-2 rounded-lg mt-1 disabled:opacity-60"
        >
          {status === "loading" ? "Importing…" : "Import from BetPawa"}
        </button>
        {error && (
          <p className="text-[11px] text-[#F97373] mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Imported slip */}
      {hasSlip && slip && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#111111] border border-[#262626] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9CA3AF]">Bookmaker</span>
              <span className="text-white font-medium">
                BetPawa Tanzania
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9CA3AF]">Code</span>
              <span className="text-white font-mono text-[11px]">
                {slip.code}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9CA3AF]">Total odds</span>
              <span className="text-[#FACC15] font-semibold">
                {slip.totalOdds.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selections list */}
          <div className="rounded-xl bg-[#111111] border border-[#262626] p-3 space-y-2 max-h-64 overflow-y-auto">
            <p className="text-[11px] text-[#9CA3AF]">
              Selections
            </p>
            {slip.selections.map((sel, index) => (
              <div
                key={`${sel.match}-${sel.pick}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] px-2 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-white font-medium">
                    {sel.match}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {sel.marketGroup ? `${sel.marketGroup} · ${sel.pick}` : sel.pick}
                  </span>
                  {sel.kickoff && (
                    <span className="text-[10px] text-[#6B7280]">
                      {new Date(sel.kickoff).toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#FBBF24] font-semibold">
                  {sel.odds.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Unified actions */}
          <SlipActions
            bets={slip.selections.map((sel) => {
              // Parse match string "Team A vs Team B" or similar
              const parts = sel.match.split(/\s+vs\s+/i);
              return {
                homeTeam: parts[0]?.trim() || sel.match,
                awayTeam: parts[1]?.trim() || "",
                market: sel.marketGroup || "Unknown",
                selection: sel.pick,
                odds: sel.odds,
              };
            }) as SlipBet[]}
            bookmaker="BetPawa Tanzania"
            bookingCode={slip.code}
            rawText={`Imported from BetPawa booking code ${slip.code}`}
            source="import"
          />
        </div>
      )}
    </section>
  );
}