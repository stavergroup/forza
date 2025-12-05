import Link from "next/link";
import Image from "next/image";
import { fetchFromApiFootball } from "@/lib/apiFootball";
import { demoMatches } from "@/lib/demoData";

type MatchListFixture = {
  id: number;
  league: string;
  leagueRound?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  dateLabel: string;
  timeLabel: string;
  statusShort: string;
};

async function fetchTodayFixtures(): Promise<MatchListFixture[]> {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const res = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { date: today },
    });

    const arr: any[] = res?.response ?? [];
    if (!arr.length) {
      console.warn("[FORZA MATCHES] No fixtures from API. Using demo matches.");
      return demoMatches.map((m) => ({
        id: Number(m.id),
        league: m.league,
        leagueRound: undefined,
        homeTeam: m.home,
        awayTeam: m.away,
        homeLogo: null,
        awayLogo: null,
        dateLabel: "Demo",
        timeLabel: m.time,
        statusShort: m.status,
      }));
    }

    return arr.map((item) => {
      const fixture = item.fixture ?? {};
      const league = item.league ?? {};
      const teams = item.teams ?? {};
      const statusShort: string = fixture.status?.short ?? "NS";
      const dateObj = fixture.date ? new Date(fixture.date) : null;

      return {
        id: fixture.id as number,
        league: league.name ?? "Unknown league",
        leagueRound: league.round ?? undefined,
        homeTeam: teams.home?.name ?? "Home",
        awayTeam: teams.away?.name ?? "Away",
        homeLogo: teams.home?.logo ?? null,
        awayLogo: teams.away?.logo ?? null,
        dateLabel: dateObj
          ? dateObj.toLocaleDateString([], { day: "2-digit", month: "short" })
          : "",
        timeLabel: dateObj
          ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        statusShort,
      };
    });
  } catch (error) {
    console.error("[FORZA MATCHES] Failed to fetch fixtures:", error);
    return demoMatches.map((m) => ({
      id: Number(m.id),
      league: m.league,
      leagueRound: undefined,
      homeTeam: m.home,
      awayTeam: m.away,
      homeLogo: null,
      awayLogo: null,
      dateLabel: "Demo",
      timeLabel: m.time,
      statusShort: m.status,
    }));
  }
}

function statusLabel(short: string) {
  const s = (short || "").toUpperCase();
  if (s === "NS" || s === "TBD") return "Upcoming";
  if (s === "FT") return "Finished";
  if (["1H", "2H", "HT", "ET", "LIVE"].includes(s)) return "Live";
  return s || "Unknown";
}

export default async function MatchesPage() {
  const fixtures = await fetchTodayFixtures();

  return (
    <main className="pt-2 pb-4 space-y-4">
      <section className="space-y-1">
        <h1 className="text-sm font-semibold text-slate-100">
          Today's matches
        </h1>
        <p className="text-[11px] text-slate-400">
          Explore today's fixtures and tap any match to see AI insights and build your slip.
        </p>
      </section>

      {fixtures.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          No fixtures available for today.
        </p>
      ) : (
        <section className="space-y-2">
          {fixtures.map((f) => (
            <Link
              key={f.id}
              href={`/matches/${f.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/85 px-3 py-2 text-[11px] hover:border-emerald-400/40 hover:bg-slate-900/90 transition-colors"
            >
              {/* Logos */}
              <div className="flex flex-col items-center gap-1">
                <TeamLogo name={f.homeTeam} logo={f.homeLogo} />
                <TeamLogo name={f.awayTeam} logo={f.awayLogo} />
              </div>

              {/* Teams and league */}
              <div className="flex-1">
                <p className="text-slate-100">
                  {f.homeTeam} <span className="text-slate-500">vs</span>{" "}
                  {f.awayTeam}
                </p>
                <p className="text-[10px] text-slate-500">
                  {f.league}
                  {f.leagueRound ? ` · ${f.leagueRound}` : ""}
                </p>
              </div>

              {/* Time + status */}
              <div className="text-right">
                <p className="text-slate-200">{f.timeLabel}</p>
                <p className="text-[10px] text-slate-500">
                  {statusLabel(f.statusShort)}
                </p>
                {f.dateLabel && (
                  <p className="text-[9px] text-slate-500">{f.dateLabel}</p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

type TeamLogoProps = {
  name: string;
  logo: string | null;
};

function TeamLogo({ name, logo }: TeamLogoProps) {
  if (!logo) {
    const initials = name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="h-7 w-7 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-300">
        {initials}
      </div>
    );
  }

  return (
    <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
      <Image
        src={logo}
        alt={name}
        width={28}
        height={28}
        className="object-contain"
      />
    </div>
  );
}