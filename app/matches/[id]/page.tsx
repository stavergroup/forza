import { notFound } from "next/navigation";
import { fetchFromApiFootball } from "@/lib/apiFootball";
import { demoMatches } from "@/lib/demoData";
import { getMatchInsightText, MatchAiContext } from "@/lib/ai";
import SlipBuilder from "@/components/SlipBuilder";
import type { SlipAiContext } from "@/lib/aiSlip";
import MySlip from "@/components/MySlip";

type ForzaStatus = "LIVE" | "FT" | "NS";

type ForzaMatchDetails = {
  id: number;
  league: string;
  round?: string;
  venue?: string;
  referee?: string;
  date: string;
  time: string;
  status: ForzaStatus;
  statusText: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  score?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  homeTeamId?: number;
  awayTeamId?: number;
  events: {
    id: string;
    minute: number | null;
    team: string;
    type: string;
    detail?: string;
    player?: string;
    assist?: string;
  }[];
  lineups: {
    home?: {
      coach?: string;
      formation?: string;
      players: string[];
    };
    away?: {
      coach?: string;
      formation?: string;
      players: string[];
    };
  };
  stats: {
    type: string;
    home: string | number | null;
    away: string | number | null;
  }[];
  homeForm: {
    id: number;
    date: string;
    result: "W" | "D" | "L";
    homeTeam: string;
    awayTeam: string;
    score: string;
  }[];
  awayForm: {
    id: number;
    date: string;
    result: "W" | "D" | "L";
    homeTeam: string;
    awayTeam: string;
    score: string;
  }[];
  h2h: {
    id: number;
    date: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    winner: string | null;
  }[];
};

function mapStatus(short: string | undefined): ForzaStatus {
  if (!short) return "NS";
  if (short === "FT" || short === "AET" || short === "PEN") return "FT";
  if (["NS", "PST", "TBD"].includes(short)) return "NS";
  return "LIVE";
}

function resultFromGoals(
  home: number | null,
  away: number | null
): "W" | "D" | "L" {
  if (home === null || away === null) return "D";
  if (home > away) return "W";
  if (home < away) return "L";
  return "D";
}

async function fetchFixtureWithDetails(
  id: number
): Promise<ForzaMatchDetails | null> {
  try {
    const fixtureRes = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { id },
    });

    const main = fixtureRes?.response?.[0];
    if (!main) {
      console.warn("[FORZA] No fixture data for id", id);
      return null;
    }

    const fixture = main.fixture ?? {};
    const league = main.league ?? {};
    const teams = main.teams ?? {};
    const goals = main.goals ?? {};
    const statusShort: string | undefined = fixture.status?.short;
    const status: ForzaStatus = mapStatus(statusShort);

    const fixtureId = fixture.id as number;
    const homeId = teams.home?.id as number | undefined;
    const awayId = teams.away?.id as number | undefined;

    // Parallel calls for H2H + form
    const [h2hRes, homeFormRes, awayFormRes] = await Promise.allSettled([
      homeId && awayId
        ? fetchFromApiFootball<any>({
            path: "/fixtures/headtohead",
            searchParams: {
              h2h: `${homeId}-${awayId}`,
              last: 5,
            },
          })
        : Promise.resolve(null),
      homeId
        ? fetchFromApiFootball<any>({
            path: "/fixtures",
            searchParams: { team: homeId, last: 5 },
          })
        : Promise.resolve(null),
      awayId
        ? fetchFromApiFootball<any>({
            path: "/fixtures",
            searchParams: { team: awayId, last: 5 },
          })
        : Promise.resolve(null),
    ]);

    // Map H2H
    let h2h: ForzaMatchDetails["h2h"] = [];
    if (h2hRes.status === "fulfilled" && h2hRes.value) {
      const arr = h2hRes.value.response ?? [];
      h2h = arr.slice(0, 5).map((m: any) => {
        const mGoals = m.goals ?? {};
        const mFixture = m.fixture ?? {};
        const mTeams = m.teams ?? {};
        const homeGoals = mGoals.home ?? 0;
        const awayGoals = mGoals.away ?? 0;
        let winner: string | null = null;
        if (homeGoals > awayGoals) winner = mTeams.home?.name ?? null;
        else if (awayGoals > homeGoals) winner = mTeams.away?.name ?? null;

        return {
          id: mFixture.id,
          date: mFixture.date
            ? new Date(mFixture.date).toLocaleDateString()
            : "",
          league: m.league?.name ?? "",
          homeTeam: mTeams.home?.name ?? "Home",
          awayTeam: mTeams.away?.name ?? "Away",
          score: `${homeGoals} - ${awayGoals}`,
          winner,
        };
      });
    }

    // Map form for a team
    function mapFormResponse(res: any): ForzaMatchDetails["homeForm"] {
      if (!res || !Array.isArray(res.response)) return [];
      return res.response.slice(0, 5).map((m: any) => {
        const mFixture = m.fixture ?? {};
        const mTeams = m.teams ?? {};
        const mGoals = m.goals ?? {};
        const homeGoals = mGoals.home ?? 0;
        const awayGoals = mGoals.away ?? 0;
        const result = resultFromGoals(homeGoals, awayGoals);
        return {
          id: mFixture.id,
          date: mFixture.date
            ? new Date(mFixture.date).toLocaleDateString()
            : "",
          homeTeam: mTeams.home?.name ?? "Home",
          awayTeam: mTeams.away?.name ?? "Away",
          score: `${homeGoals} - ${awayGoals}`,
          result,
        };
      });
    }

    const homeForm =
      homeFormRes.status === "fulfilled" && homeFormRes.value
        ? mapFormResponse(homeFormRes.value)
        : [];
    const awayForm =
      awayFormRes.status === "fulfilled" && awayFormRes.value
        ? mapFormResponse(awayFormRes.value)
        : [];

    // Map events
    const eventsArr: any[] = main.events ?? [];
    const events: ForzaMatchDetails["events"] = eventsArr.map(
      (e: any, idx: number) => ({
        id: `${fixtureId}-ev-${idx}`,
        minute: e.time?.elapsed ?? null,
        team: e.team?.name ?? "",
        type: e.type ?? "",
        detail: e.detail ?? "",
        player: e.player?.name ?? "",
        assist: e.assist?.name ?? "",
      })
    );

    // Map lineups
    const lineupsArr: any[] = main.lineups ?? [];
    const homeLineupRaw = homeId
      ? lineupsArr.find((l: any) => l.team?.id === homeId)
      : undefined;
    const awayLineupRaw = awayId
      ? lineupsArr.find((l: any) => l.team?.id === awayId)
      : undefined;

    function mapPlayers(l: any | undefined): string[] {
      if (!l || !Array.isArray(l.startXI)) return [];
      return l.startXI
        .map((p: any) => p.player?.name)
        .filter(Boolean)
        .slice(0, 11);
    }

    const lineups: ForzaMatchDetails["lineups"] = {
      home: homeLineupRaw
        ? {
            coach: homeLineupRaw.coach?.name,
            formation: homeLineupRaw.formation ?? undefined,
            players: mapPlayers(homeLineupRaw),
          }
        : undefined,
      away: awayLineupRaw
        ? {
            coach: awayLineupRaw.coach?.name,
            formation: awayLineupRaw.formation ?? undefined,
            players: mapPlayers(awayLineupRaw),
          }
        : undefined,
    };

    // Map stats
    const statsArr: any[] = main.statistics ?? [];
    const homeStats = statsArr[0]?.statistics ?? [];
    const awayStats = statsArr[1]?.statistics ?? [];

    function getStatValue(
      stats: any[],
      type: string
    ): string | number | null {
      const found = stats.find((s: any) => s.type === type);
      if (!found) return null;
      return found.value;
    }

    const trackedTypes = [
      "Ball Possession",
      "Total Shots",
      "Shots on Goal",
      "Shots off Goal",
      "Corner Kicks",
      "Yellow Cards",
      "Red Cards",
      "Offsides",
      "Fouls",
    ];

    const mappedStats: ForzaMatchDetails["stats"] = trackedTypes.map(
      (t) => ({
        type: t,
        home: getStatValue(homeStats, t),
        away: getStatValue(awayStats, t),
      })
    );

    const homeGoals = goals.home ?? null;
    const awayGoals = goals.away ?? null;

    return {
      id: fixtureId,
      league: league.name ?? "Unknown league",
      round: league.round,
      venue: fixture.venue?.name,
      referee: fixture.referee,
      date: fixture.date
        ? new Date(fixture.date).toLocaleDateString()
        : "",
      time: fixture.date
        ? new Date(fixture.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      status,
      statusText: fixture.status?.long ?? "",
      homeTeam: teams.home?.name ?? "Home team",
      awayTeam: teams.away?.name ?? "Away team",
      homeLogo: teams.home?.logo,
      awayLogo: teams.away?.logo,
      score:
        homeGoals !== null && homeGoals !== undefined &&
        awayGoals !== null && awayGoals !== undefined
          ? `${homeGoals} - ${awayGoals}`
          : undefined,
      homeGoals,
      awayGoals,
      homeTeamId: homeId,
      awayTeamId: awayId,
      events,
      lineups,
      stats: mappedStats,
      homeForm,
      awayForm,
      h2h,
    };
  } catch (error) {
    console.error("[FORZA] Failed to fetch fixture details:", error);
    return null;
  }
}

type MatchPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailsPage({ params }: MatchPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  let details: ForzaMatchDetails | null = null;

  if (!Number.isNaN(numericId)) {
    details = await fetchFixtureWithDetails(numericId);
  }

  // Fallback to demo data for old IDs or API failure
  if (!details) {
    const fallback = demoMatches.find((m) => m.id === id);
    if (!fallback) {
      return notFound();
    }

    return (
      <main className="px-4 pt-4 pb-4 space-y-4">
        <header>
          <p className="text-[11px] text-slate-400 mb-1">{fallback.league}</p>
          <h1 className="text-lg font-semibold">
            {fallback.home} vs {fallback.away}
          </h1>
          <p className="text-xs text-slate-400">
            Demo fixture · {fallback.time} · status: {fallback.status}
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
          <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
            FORZA AI Insight (demo)
          </p>
          <p className="text-xs text-emerald-100">
            This is using demo data because the real fixture details were not
            available. Once AI is connected, this box will show a deeper
            breakdown of the game.
          </p>
        </section>

        <SlipBuilder
          context={{
            homeTeam: fallback.home,
            awayTeam: fallback.away,
            league: fallback.league,
            status: fallback.status,
            homeRecentForm: [],
            awayRecentForm: [],
          }}
        />

        <MySlip
          matchId={fallback.id}
          homeTeam={fallback.home}
          awayTeam={fallback.away}
          league={fallback.league}
        />
      </main>
    );
  }

  const d = details;

  // Build FORZA AI context for match insight
  const homeRecentForm = d.homeForm.map((m) => m.result);
  const awayRecentForm = d.awayForm.map((m) => m.result);

  let h2hSummary: string | undefined;
  if (d.h2h.length > 0) {
    const winsHome = d.h2h.filter((m) => m.winner === d.homeTeam).length;
    const winsAway = d.h2h.filter((m) => m.winner === d.awayTeam).length;
    const draws = d.h2h.length - winsHome - winsAway;
    h2hSummary = `${d.homeTeam} wins: ${winsHome}, ${d.awayTeam} wins: ${winsAway}, Draws: ${draws} in their last ${d.h2h.length} meetings.`;
  }

  const aiContext: MatchAiContext = {
    homeTeam: d.homeTeam,
    awayTeam: d.awayTeam,
    league: d.league,
    status: d.statusText,
    homeRecentForm,
    awayRecentForm,
    h2hSummary,
    notes:
      "This context is generated inside the FORZA app using live fixture data.",
  };

  const aiInsight = await getMatchInsightText(aiContext);

  // Build slip AI context
  const slipContext: SlipAiContext = {
    homeTeam: d.homeTeam,
    awayTeam: d.awayTeam,
    league: d.league,
    status: d.statusText,
    homeRecentForm,
    awayRecentForm,
    h2hSummary,
    preferredMarkets: ["1X2", "Over/Under", "BTTS"],
  };

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-[11px] text-slate-400 mb-1">
          {d.league}
          {d.round ? ` · ${d.round}` : ""}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400">Home</span>
              <span className="text-sm font-semibold text-slate-100">
                {d.homeTeam}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-300">
              {d.status === "LIVE"
                ? "LIVE"
                : d.status === "FT"
                ? "Full time"
                : "Kickoff"}
            </p>
            <p className="text-base font-bold text-slate-50">
              {d.score ?? "- : -"}
            </p>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-slate-400">Away</span>
              <span className="text-sm font-semibold text-slate-100">
                {d.awayTeam}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          {d.date} · {d.time} · {d.statusText}
        </p>
      </header>

      {/* FORZA AI Insight */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
        <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide mb-1">
          FORZA AI Insight
        </p>
        <p className="whitespace-pre-wrap text-xs text-emerald-50">
          {aiInsight}
        </p>
      </section>

      {/* Key facts */}
      <section className="flex flex-wrap gap-2 text-[11px]">
        {d.venue && (
          <span className="px-2 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300">
            🏟 {d.venue}
          </span>
        )}
        {d.referee && (
          <span className="px-2 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300">
            👨‍⚖️ {d.referee}
          </span>
        )}
      </section>

      {/* Events */}
      {d.events.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-200">
            Match events
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1 max-h-56 overflow-y-auto">
            {d.events.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center text-[11px]"
              >
                <div className="text-slate-400 w-10">
                  {e.minute !== null ? `${e.minute}'` : ""}
                </div>
                <div className="flex-1 text-slate-100">
                  <span className="font-semibold">{e.team}</span>{" "}
                  <span className="text-slate-300">
                    {e.type} {e.detail ? `· ${e.detail}` : ""}
                  </span>
                  {e.player && (
                    <span className="text-slate-300"> · {e.player}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lineups */}
      {(d.lineups.home || d.lineups.away) && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-200">Lineups</h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {d.lineups.home && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <p className="font-semibold text-slate-200">
                  {d.homeTeam}
                </p>
                <p className="text-slate-400">
                  Coach: {d.lineups.home.coach ?? "N/A"}
                </p>
                <p className="text-slate-400">
                  Formation: {d.lineups.home.formation ?? "-"}
                </p>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {d.lineups.home.players.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.lineups.away && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <p className="font-semibold text-slate-200">
                  {d.awayTeam}
                </p>
                <p className="text-slate-400">
                  Coach: {d.lineups.away.coach ?? "N/A"}
                </p>
                <p className="text-slate-400">
                  Formation: {d.lineups.away.formation ?? "-"}
                </p>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {d.lineups.away.players.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      {d.stats.some((s) => s.home !== null || s.away !== null) && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-200">
            Match stats
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1 text-[11px]">
            {d.stats.map((s) => {
              if (s.home === null && s.away === null) return null;
              return (
                <div
                  key={s.type}
                  className="flex justify-between items-center"
                >
                  <span className="w-16 text-right text-slate-200">
                    {s.home ?? "-"}
                  </span>
                  <span className="flex-1 text-center text-slate-400">
                    {s.type}
                  </span>
                  <span className="w-16 text-left text-slate-200">
                    {s.away ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Form */}
      {(d.homeForm.length > 0 || d.awayForm.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-200">
            Recent form
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {d.homeForm.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <p className="font-semibold text-slate-200">
                  {d.homeTeam}
                </p>
                <div className="flex gap-1">
                  {d.homeForm.map((m) => (
                    <span
                      key={m.id}
                      className={`px-2 py-1 rounded-full text-[10px] ${
                        m.result === "W"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : m.result === "L"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-slate-700/40 text-slate-200"
                      }`}
                    >
                      {m.result}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.awayForm.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <p className="font-semibold text-slate-200">
                  {d.awayTeam}
                </p>
                <div className="flex gap-1">
                  {d.awayForm.map((m) => (
                    <span
                      key={m.id}
                      className={`px-2 py-1 rounded-full text-[10px] ${
                        m.result === "W"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : m.result === "L"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-slate-700/40 text-slate-200"
                      }`}
                    >
                      {m.result}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* H2H */}
      {d.h2h.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-200">
            Head to head (last {d.h2h.length})
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1 text-[11px]">
            {d.h2h.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center gap-2"
              >
                <div className="flex-1">
                  <p className="text-slate-300">
                    {m.homeTeam} vs {m.awayTeam}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {m.date} · {m.league}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-100">
                    {m.score}
                  </p>
                  {m.winner && (
                    <p className="text-[10px] text-emerald-300">
                      {m.winner} won
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Slip Builder */}
      <SlipBuilder context={slipContext} />

      {/* My Slip (saved per user) */}
      <MySlip
        matchId={d.id}
        homeTeam={d.homeTeam}
        awayTeam={d.awayTeam}
        league={d.league}
      />
    </main>
  );
}