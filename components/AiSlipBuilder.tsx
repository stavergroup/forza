"use client";

import { useState } from "react";
import SlipActions, { SlipBet } from "@/components/SlipActions";

type RiskLevel = "safe" | "medium" | "high";

type AiBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
  kickoffTime: string; // ISO 8601
  league?: string;
};

type AiSlip = {
  bets: AiBet[];
  totalOdds: number;
};

const LEAGUES = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
];

export default function AiSlipBuilder() {
  const [targetOdds, setTargetOdds] = useState<string>("");
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [aiSlip, setAiSlip] = useState<AiSlip | null>(null);

  function toggleLeague(name: string) {
    setSelectedLeagues((prev) =>
      prev.includes(name)
        ? prev.filter((l) => l !== name)
        : [...prev, name]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setErrorMsg(null);
    setAiSlip(null);

    try {
      const res = await fetch("/api/slips/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetOdds: targetOdds ? Number(targetOdds) : null,
          riskLevel: risk,
          leagues: selectedLeagues,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to build slip.");
      }

      const data = await res.json();
      setAiSlip({
        bets: data.bets ?? [],
        totalOdds: data.totalOdds ?? 1,
      });
    } catch (err: any) {
      console.error("[FORZA] ask-ai error:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const bets = aiSlip?.bets ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#A8A8A8]">
          Ask AI to build a slip
        </p>
        <span className="text-[11px] text-[var(--forza-accent)] font-semibold">
          FORZA&nbsp;AI
        </span>
      </div>

      {/* Target odds */}
      <div className="space-y-1">
        <p className="text-[11px] text-[#A8A8A8]">Target total odds</p>
        <input
          type="number"
          inputMode="decimal"
          min={1}
          step={0.1}
          placeholder="Example: 3.0 · 5.5 · 10 · 20"
          value={targetOdds}
          onChange={(e) => setTargetOdds(e.target.value)}
          className="w-full rounded-xl bg-[#101010] border border-[#262626] px-3 py-2 text-[12px] text-white placeholder:text-[#555]"
        />
        <p className="text-[10px] text-[#6B6B6B]">
          Tell FORZA AI roughly how many total odds you want.
        </p>
      </div>

      {/* Risk level */}
      <div className="space-y-2">
        <p className="text-[11px] text-[#A8A8A8]">Risk level</p>
        <div className="flex gap-2">
          {(["safe", "medium", "high"] as RiskLevel[]).map((level) => {
            const active = risk === level;
            const label =
              level === "safe"
                ? "Safe"
                : level === "medium"
                ? "Medium"
                : "High";
            return (
              <button
                key={level}
                type="button"
                onClick={() => setRisk(level)}
                className={`flex-1 rounded-full border px-3 py-1.5 text-[11px] ${
                  active
                    ? "border-[var(--forza-accent)] bg-[rgba(164,255,47,0.08)] text-[var(--forza-accent)]"
                    : "border-[#2A2A2A] bg-[#111111] text-[#D4D4D4]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leagues */}
      <div className="space-y-2">
        <p className="text-[11px] text-[#A8A8A8]">
          Focus leagues (optional)
        </p>
        <div className="flex flex-wrap gap-2">
          {LEAGUES.map((lg) => {
            const active = selectedLeagues.includes(lg);
            return (
              <button
                key={lg}
                type="button"
                onClick={() => toggleLeague(lg)}
                className={`rounded-full border px-3 py-1 text-[11px] ${
                  active
                    ? "border-[var(--forza-accent)] bg-[rgba(164,255,47,0.08)] text-[var(--forza-accent)]"
                    : "border-[#2A2A2A] bg-[#111111] text-[#D4D4D4]"
                }`}
              >
                {lg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-full bg-[var(--forza-accent)] text-black font-semibold py-2.5 text-[13px] shadow-[0_0_18px_var(--forza-glow)] disabled:opacity-60"
      >
        {loading ? "Asking FORZA AI…" : "Ask AI to generate slip"}
      </button>

      {errorMsg && (
        <p className="text-[11px] text-[#FF6B81]">{errorMsg}</p>
      )}

      {/* Result */}
      {aiSlip && bets.length > 0 && (
        <div className="mt-3 space-y-3 rounded-2xl bg-[#0C0C0C] border border-[#202020] px-3 py-3">
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-white">
              FORZA AI slip
            </p>
            <p className="text-[11px] text-[#CFCFCF]">
              <span className="text-[var(--forza-accent)] font-semibold">
                {aiSlip.bets.length}-pick · {aiSlip.totalOdds.toFixed(2)}x
              </span>
            </p>
          </div>

          <div className="space-y-2">
            {bets.map((bet, index) => (
              <div
                key={index}
                className="rounded-xl bg-[#111111] border border-[#2A2A2A] px-3 py-2 text-[11px]"
              >
                <p className="text-white">
                  {bet.homeTeam}{" "}
                  <span className="text-[#777]">vs</span>{" "}
                  {bet.awayTeam}
                </p>
                <p className="text-[#A8A8A8]">
                  {bet.market} • {bet.selection}
                  <span className="text-[var(--forza-accent)]">
                    {" "}
                    @ {bet.odds.toFixed(2)}
                  </span>
                </p>
                {bet.kickoffTime && (
                  <p className="text-[10px] text-[#7A7A7A]">
                    Kickoff:{" "}
                    {new Date(bet.kickoffTime).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Shared actions: Post / Save / Track */}
          <SlipActions
            bets={bets.map((b) => ({
              homeTeam: b.homeTeam,
              awayTeam: b.awayTeam,
              market: b.market,
              pick: b.selection,
              odd: b.odds,
              kickoffTime: b.kickoffTime ?? null,
              league: (b as any).league ?? null,
            }))}
            bookmaker={null}
            bookingCode={null}
            rawText={`AI-generated slip with ${bets.length} selections, total odds ${aiSlip.totalOdds.toFixed(2)}`}
            source="ai"
          />
        </div>
      )}
    </div>
  );
}