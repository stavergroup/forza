import Link from "next/link";
import { demoMatches } from "@/lib/demoData";
import { fetchFromApiFootball } from "@/lib/apiFootball";

type ForzaMatch = {
  id: string;
  league: string;
  time: string;
  status: "LIVE" | "FT" | "NS";
  home: string;
  away: string;
  score?: string;
  aiEdge?: string;
};

async function getMatches(): Promise<ForzaMatch[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const data = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: {
        date: today,
      },
    });

    if (!data || !Array.isArray(data.response)) {
      console.warn("[FORZA] Unexpected API-FOOTBALL response, using demoMatches.");
      return demoMatches as unknown as ForzaMatch[];
    }

    const mapped: ForzaMatch[] = data.response.slice(0, 10).map((m: any) => {
      const statusShort: string = m.fixture?.status?.short ?? "NS";
      const status: "LIVE" | "FT" | "NS" =
        statusShort === "FT"
          ? "FT"
          : statusShort === "NS"
          ? "NS"
          : "LIVE";

      return {
        id: String(m.fixture.id),
        league: m.league?.name ?? "Unknown league",
        time: m.fixture?.date
          ? new Date(m.fixture.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--",
        status,
        home: m.teams?.home?.name ?? "Home team",
        away: m.teams?.away?.name ?? "Away team",
        score:
          m.goals?.home !== null &&
          m.goals?.home !== undefined &&
          m.goals?.away !== null &&
          m.goals?.away !== undefined
            ? `${m.goals.home} - ${m.goals.away}`
            : undefined,
        aiEdge: "Edge coming soon", // placeholder for future AI signal
      };
    });

    if (!mapped.length) {
      console.warn("[FORZA] No fixtures returned, falling back to demoMatches.");
      return demoMatches as unknown as ForzaMatch[];
    }

    return mapped;
  } catch (err) {
    console.error("[FORZA] Using demoMatches due to error:", err);
    return demoMatches as unknown as ForzaMatch[];
  }
}

export default async function MatchesPage() {
  const matches = await getMatches();

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header className="mb-2">
        <h1 className="text-lg font-semibold">Matches</h1>
        <p className="text-xs text-slate-400">
          Today&apos;s fixtures from API-FOOTBALL (with demo fallback).
        </p>
      </header>

      <section className="space-y-2">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
          >
            <p className="text-[11px] text-slate-400 mb-1">{match.league}</p>
            <p className="text-sm font-semibold">
              {match.home}{" "}
              <span className="text-emerald-400 text-xs align-middle">vs</span>{" "}
              {match.away}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {match.status === "LIVE"
                  ? "LIVE · " + (match.score ?? "")
                  : match.status === "FT"
                  ? "FT · " + (match.score ?? "")
                  : "Today · " + match.time}
              </span>
              {match.aiEdge && (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300">
                  FORZA Edge: {match.aiEdge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}