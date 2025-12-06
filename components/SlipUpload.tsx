"use client";

import { FormEvent, useState } from "react";

type ParsedBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number | null;
};

type ParsedSlip = {
  isBetSlip?: boolean;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets?: ParsedBet[];
  rawText?: string;
};

export default function SlipUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedSlip | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setResult(null);
      setErrorMsg(null);
      return;
    }
    setFileName(file.name);
    setResult(null);
    setErrorMsg(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    const input = e.currentTarget.elements.namedItem(
      "file"
    ) as HTMLInputElement | null;

    if (!input || !input.files || input.files.length === 0) {
      setErrorMsg("Please choose a slip screenshot first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", input.files[0]);

    setLoading(true);
    try {
      const res = await fetch("/api/slips/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to read slip.");
      }

      const data: ParsedSlip = await res.json();
      setResult(data);

      if (data.isBetSlip === false) {
        setErrorMsg("This is not a screenshot of a football betslip.");
      }
    } catch (err: any) {
      console.error("[FORZA] slip upload error:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const bets = result?.bets ?? [];
  const isBetSlip = result?.isBetSlip ?? (bets.length > 0);

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Upload area */}
        <label className="block w-full rounded-2xl border border-dashed border-[#3A3A3A] bg-[#111111] px-4 py-5 text-center text-xs text-[#A8A8A8] active:border-[var(--forza-accent)]">
          <input
            type="file"
            name="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#1C1C1C] flex items-center justify-center text-lg">
              📷
            </div>
            <div>
              <p className="text-[12px] text-white">
                Tap to upload slip screenshot
              </p>
              <p className="text-[11px] text-[#7A7A7A]">
                Use a clear screenshot of a football betslip.
              </p>
            </div>
            {fileName && (
              <p className="text-[10px] text-[#9F9F9F] mt-1">
                Selected: {fileName}
              </p>
            )}
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--forza-accent)] text-black font-semibold py-2.5 text-[13px] shadow-[0_0_18px_var(--forza-glow)] disabled:opacity-60"
        >
          {loading ? "Reading slip…" : "Analyze slip with FORZA AI"}
        </button>
      </form>

      {errorMsg && (
        <p className="text-[11px] text-[#FF6B81]">{errorMsg}</p>
      )}

      {/* Only show detected bets if it is a betslip */}
      {isBetSlip && bets.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[12px] font-medium text-white">
            Detected bets
          </p>
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
                {bet.odds != null && (
                  <span className="text-[var(--forza-accent)]">
                    {" "}
                    • @ {bet.odds}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}