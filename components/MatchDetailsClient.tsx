"use client";

import Image from "next/image";
import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { db } from "@/lib/firestoreClient";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export type MatchDetailsData = {
  id: number | string;
  league: string;
  leagueRound?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  status: string;
  venue?: string;
  city?: string;
  dateLabel?: string;
  timeLabel?: string;
  homeGoals: number | null;
  awayGoals: number | null;
  fullScoreLabel?: string;
  halftimeScoreLabel?: string;
};

type Props = {
  match: MatchDetailsData;
  aiSummary: string;
};

const BASE_MARKETS = [
  "Home to win",
  "Draw",
  "Away to win",
  "Over 2.5 goals",
  "Under 2.5 goals",
  "Both teams to score",
];

export default function MatchDetailsClient({ match, aiSummary }: Props) {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [stake, setStake] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const user = auth.currentUser;

  function toggleMarket(m: string) {
    setSelectedMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  async function handleSaveSlip() {
    try {
      setSaveError(null);
      setSaveSuccess(null);

      if (!user) {
        setSaveError("Please sign in first.");
        return;
      }

      if (!selectedMarkets.length) {
        setSaveError("Pick at least one market.");
        return;
      }

      const stakeNum = Number(stake);
      if (!stakeNum || stakeNum <= 0) {
        setSaveError("Enter a valid stake.");
        return;
      }

      setSaving(true);

      await addDoc(collection(db, "users", user.uid, "slips"), {
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        markets: selectedMarkets,
        stake: stakeNum,
        createdAt: serverTimestamp(),
      });

      setSaveSuccess("Slip saved.");
      setSelectedMarkets([]);
      setStake("");
    } catch (error) {
      console.error("[FORZA] Save slip error:", error);
      setSaveError("Failed to save slip.");
    } finally {
      setSaving(false);
    }
  }

  function statusLabel() {
    const s = match.status?.toUpperCase() || "NS";
    if (s === "NS") return "Not started";
    if (s === "FT") return "Finished";
    if (["1H", "2H", "HT", "ET", "LIVE"].includes(s)) return "Live";
    return s;
  }

  const isLive = statusLabel() === "Live";

  return (
    <main className="pt-2 pb-20 space-y-4">
      {/* Scoreboard */}
      <section className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/90 to-slate-950 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-300 uppercase">{match.league}</p>
            {match.leagueRound && (
              <p className="text-[10px] text-emerald-200/80">{match.leagueRound}</p>
            )}
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            isLive
              ? "bg-red-500/10 border border-red-500/60 text-red-300"
              : statusLabel() === "Finished"
              ? "bg-slate-900 border border-slate-600 text-slate-300"
              : "bg-emerald-500/10 border border-emerald-500/60 text-emerald-200"
          }`}>
            {statusLabel()}
          </span>
        </div>

        {/* teams + score */}
        <div className="flex items-center justify-between mt-3">
          <TeamLogo name={match.homeTeam} logo={match.homeLogo} />
          <div className="text-center">
            {match.fullScoreLabel ? (
              <>
                <p className="text-2xl text-slate-50">{match.fullScoreLabel}</p>
                {match.halftimeScoreLabel && (
                  <p className="text-[10px] text-slate-400">HT {match.halftimeScoreLabel}</p>
                )}
              </>
            ) : (
              <p className="text-xl text-slate-50">vs</p>
            )}
          </div>
          <TeamLogo name={match.awayTeam} logo={match.awayLogo} />
        </div>
      </section>

      {/* AI Insight */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-[11px] text-slate-300 font-semibold">FORZA Edge • AI insight</p>
        <p className="text-[11px] text-slate-200 mt-1 whitespace-pre-wrap">{aiSummary}</p>
      </section>

      {/* Slip Builder */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4 space-y-3">
        <p className="text-[11px] text-slate-300 font-semibold">Build your slip</p>

        <div className="flex flex-wrap gap-1">
          {BASE_MARKETS.map((m) => {
            const active = selectedMarkets.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMarket(m)}
                className={`px-3 py-1 rounded-full text-[10px] border ${
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950/60 text-slate-300"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        <input
          type="number"
          inputMode="numeric"
          placeholder="Stake"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-[11px] text-slate-100"
        />

        {saveError && <p className="text-[11px] text-rose-300">{saveError}</p>}
        {saveSuccess && <p className="text-[11px] text-emerald-300">{saveSuccess}</p>}

        <button
          disabled={saving}
          onClick={handleSaveSlip}
          className="w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save slip"}
        </button>
      </section>
    </main>
  );
}

function TeamLogo({ name, logo }: { name: string; logo: string | null }) {
  if (!logo) {
    const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="h-12 w-12 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-[12px] text-emerald-300">
        {initials}
      </div>
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
      <Image src={logo} alt={name} width={48} height={48} />
    </div>
  );
}