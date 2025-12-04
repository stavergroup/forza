import Link from "next/link";
import { fetchFromApiFootball } from "@/lib/apiFootball";
import { getMatchInsightText, MatchAiContext } from "@/lib/ai";
import { demoUser, demoMatches } from "@/lib/demoData";

type HomeFixture = {
  id: number;
  league: string;
  leagueShort?: string;
  date: string;
  time: string;
  status: string;
  statusShort?: string;
  timestamp?: number | null;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  leaguePriority: number;
};

function getLeaguePriority(name: string): number {
  const n = name.toLowerCase();

  // Tier 1: UCL, top European leagues
  if (
    n.includes("champions league") ||
    n.includes("uefa champions") ||
    n.includes("premier league") || // EPL
    n.includes("la liga") ||
    n.includes("serie a") ||
    n.includes("bundesliga") ||
    n.includes("ligue 1")
  ) {
    return 1;
  }

  // Tier 2: Europa, Conference, top cups
  if (
    n.includes("europa league") ||
    n.includes("conference league") ||
    n.includes("fa cup") ||
    n.includes("copa del rey") ||
    n.includes("dfb-pokal")
  ) {
    return 2;
  }

  // Tier 3: Other strong national leagues (plus EA focus)
  if (
    n.includes("eredivisie") ||
    n.includes("primeira liga") ||
    n.includes("super lig") ||
    n.includes("mls") ||
    n.includes("nbc tanzania") ||
    n.includes("tanzania premier") ||
    n.includes("fkf premier")
  ) {
    return 3;
  }

  // Tier 4: everything else
  return 4;
}

async function fetchTodayFixtures(): Promise<HomeFixture[]> {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const res = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { date: today },
    });

    const arr: any[] = res?.response ?? [];
    if (!arr.length) {
      console.warn("[FORZA] No fixtures found for today, using demo matches.");
      return demoMatches.map((m) => ({
        id: Number(m.id),
        league: m.league,
        leagueShort: m.league,
        date: "Demo",
        time: m.time,
        status: m.status,
        statusShort: m.status,
        timestamp: null,
        homeTeam: m.home,
        awayTeam: m.away,
        leaguePriority: 4,
      }));
    }

    return arr.map((item) => {
      const fixture = item.fixture ?? {};
      const league = item.league ?? {};
      const teams = item.teams ?? {};
      const statusShort: string = fixture.status?.short ?? "NS";
      const leagueName: string = league.name ?? "Unknown league";
      const leaguePriority = getLeaguePriority(leagueName);
      const timestamp =
        typeof fixture.timestamp === "number" ? fixture.timestamp : null;

      return {
        id: fixture.id as number,
        league: leagueName,
        leagueShort: league.round ?? undefined,
        date: fixture.date
          ? new Date(fixture.date).toLocaleDateString()
          : "",
        time: fixture.date
          ? new Date(fixture.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        status: statusShort,
        statusShort,
        timestamp,
        homeTeam: teams.home?.name ?? "Home",
        awayTeam: teams.away?.name ?? "Away",
        homeLogo: teams.home?.logo,
        awayLogo: teams.away?.logo,
        leaguePriority,
      };
    });
  } catch (error) {
    console.error("[FORZA] Failed to fetch today fixtures:", error);
    // Fallback to demo
    return demoMatches.map((m) => ({
      id: Number(m.id),
      league: m.league,
      leagueShort: m.league,
      date: "Demo",
      time: m.time,
      status: m.status,
      statusShort: m.status,
      timestamp: null,
      homeTeam: m.home,
      awayTeam: m.away,
      leaguePriority: 4,
    }));
  }
}

function selectHotPickCandidates(fixtures: HomeFixture[]): HomeFixture[] {
  if (!fixtures.length) return [];

  const nowSec = Math.floor(Date.now() / 1000);

  // 1) Filter to upcoming or live
  const candidates = fixtures.filter((f) => {
    const s = (f.statusShort || f.status || "").toUpperCase();
    const liveCodes = ["1H", "2H", "HT", "ET", "LIVE"];
    const upcomingCodes = ["NS", "TBD"];
    if (liveCodes.includes(s)) return true;
    if (upcomingCodes.includes(s)) {
      // Upcoming within next ~36 hours
      if (f.timestamp && f.timestamp >= nowSec - 2 * 3600) {
        return true;
      }
    }
    return false;
  });

  const base = candidates.length ? candidates : fixtures;

  // 2) Sort by league priority, then by kickoff timestamp (earliest first)
  const sorted = [...base].sort((a, b) => {
    if (a.leaguePriority !== b.leaguePriority) {
      return a.leaguePriority - b.leaguePriority;
    }
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    return ta - tb;
  });

  return sorted;
}

async function fetchHotPicks(fixtures: HomeFixture[]) {
  const sortedCandidates = selectHotPickCandidates(fixtures);
  const top = sortedCandidates.slice(0, 3);

  const results = await Promise.all(
    top.map(async (f) => {
      const ctx: MatchAiContext = {
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        league: f.league,
        status: f.statusShort || f.status,
        homeRecentForm: undefined,
        awayRecentForm: undefined,
        h2hSummary: undefined,
        notes:
          "This match was selected as a 'hot pick' on the FORZA home feed based on league importance and kickoff time.",
      };

      const insight = await getMatchInsightText(ctx);

      return {
        fixture: f,
        insight,
      };
    })
  );

  return results;
}

export default async function HomePage() {
  const statsUser = demoUser;
  const fixtures = await fetchTodayFixtures();
  const hasRealFixtures = fixtures.length > 0;
  const hotPicks = hasRealFixtures ? await fetchHotPicks(fixtures) : [];

  return (
    <main className="pt-2 pb-4 space-y-4">
      {/* HERO */}
      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-slate-900/80 to-slate-950/90 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.25)] space-y-2">
        <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-300/80">
          Live • Today
        </p>
        <h1 className="text-xl font-semibold text-slate-50">
          Football intelligence,<br />
          <span className="text-brand">built for bettors.</span>
        </h1>
        <p className="text-[11px] text-slate-300">
          FORZA scans today's fixtures, picks hot matches and helps you build smarter slips
          with AI—while you stay in control.
        </p>
        <div className="flex gap-2 text-[11px] mt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 border border-emerald-500/40 px-2 py-1 text-emerald-200">
            ⚡ AI hot picks
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 border border-slate-700 px-2 py-1 text-slate-200">
            🧠 Slip builder
          </span>
        </div>
      </section>

      {/* Quick stats row (demo stats for now) */}
      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Win rate</p>
          <p className="text-base font-semibold text-emerald-300">
            {statsUser.winRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Slips saved</p>
          <p className="text-base font-semibold text-slate-100">
            {statsUser.slipsCreated}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Streak</p>
          <p className="text-base font-semibold text-amber-300">
            {statsUser.streakDays} days
          </p>
        </div>
      </section>

      {/* Hot picks section */}
      {hotPicks.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-200">
              FORZA Hot Picks Today
            </p>
            <p className="text-[11px] text-emerald-300">
              Top leagues & kickoff time
            </p>
          </div>

          <div className="space-y-2">
            {hotPicks.map(({ fixture, insight }) => (
              <Link
                href={`/matches/${fixture.id}`}
                key={fixture.id}
                className="block rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 shadow-[0_12px_30px_rgba(16,185,129,0.28)]"
              >
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="text-[11px] text-emerald-300 uppercase tracking-wide">
                      {fixture.league}
                    </p>
                    <p className="text-xs text-emerald-50 font-medium">
                      {fixture.homeTeam} vs {fixture.awayTeam}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-emerald-100">
                    <p>{fixture.time}</p>
                    <p className="text-emerald-300">
                      {fixture.status === "NS"
                        ? "Upcoming"
                        : fixture.status === "FT"
                        ? "Finished"
                        : "Live"}
                    </p>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[11px] text-emerald-50">
                  {insight}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Today fixtures list */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-200">
            Today's fixtures
          </p>
          <Link
            href="/matches"
            className="text-[11px] text-slate-400 underline"
          >
            View all
          </Link>
        </div>

        {fixtures.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No fixtures available for today.
          </p>
        ) : (
          <div className="space-y-2">
            {fixtures.slice(0, 20).map((f) => (
              <Link
                key={f.id}
                href={`/matches/${f.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-[11px] hover:border-emerald-400/40 hover:bg-slate-900/90 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-slate-100">
                    {f.homeTeam} vs {f.awayTeam}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {f.league}
                    {f.leagueShort ? ` · ${f.leagueShort}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-200">{f.time}</p>
                  <p className="text-[10px] text-slate-500">
                    {f.status === "NS"
                      ? "Upcoming"
                      : f.status === "FT"
                      ? "Finished"
                      : "Live"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
