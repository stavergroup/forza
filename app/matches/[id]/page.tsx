import { fetchFromApiFootball } from "@/lib/apiFootball";
import { demoMatches } from "@/lib/demoData";
import { getMatchInsightText, MatchAiContext } from "@/lib/ai";
import MatchDetailsClient, {
  MatchDetailsData,
} from "@/components/MatchDetailsClient";

type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchFixture(id: string): Promise<MatchDetailsData | null> {
  try {
    const res = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { id },
    });

    const item = res?.response?.[0];
    if (!item) {
      throw new Error("No fixture in API response");
    }

    const fixture = item.fixture ?? {};
    const league = item.league ?? {};
    const teams = item.teams ?? {};
    const goals = item.goals ?? {};
    const score = item.score ?? {};

    const statusShort: string = fixture.status?.short ?? "NS";

    const dateObj = fixture.date ? new Date(fixture.date) : null;
    const localDate = dateObj
      ? dateObj.toLocaleDateString([], { day: "2-digit", month: "short" })
      : "";
    const localTime = dateObj
      ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    return {
      id: fixture.id ?? Number(id),
      league: league.name ?? "Unknown league",
      leagueRound: league.round ?? "",
      homeTeam: teams.home?.name ?? "Home",
      awayTeam: teams.away?.name ?? "Away",
      homeLogo: teams.home?.logo ?? null,
      awayLogo: teams.away?.logo ?? null,
      status: statusShort,
      venue: fixture.venue?.name ?? "",
      city: fixture.venue?.city ?? "",
      dateLabel: localDate,
      timeLabel: localTime,
      homeGoals: typeof goals.home === "number" ? goals.home : null,
      awayGoals: typeof goals.away === "number" ? goals.away : null,
      fullScoreLabel:
        typeof goals.home === "number" && typeof goals.away === "number"
          ? `${goals.home} – ${goals.away}`
          : "",
      halftimeScoreLabel:
        score?.halftime &&
        score.halftime.home != null &&
        score.halftime.away != null
          ? `${score.halftime.home} – ${score.halftime.away}`
          : "",
    };
  } catch (error) {
    console.error("[FORZA MATCH PAGE] API error:", error);
    const demo = demoMatches.find((m) => String(m.id) === String(id));
    if (!demo) return null;
    return {
      id: Number(demo.id),
      league: demo.league,
      leagueRound: "",
      homeTeam: demo.home,
      awayTeam: demo.away,
      homeLogo: null,
      awayLogo: null,
      status: demo.status,
      venue: "",
      city: "",
      dateLabel: "Demo",
      timeLabel: demo.time,
      homeGoals: null,
      awayGoals: null,
      fullScoreLabel: "",
      halftimeScoreLabel: "",
    };
  }
}

export default async function MatchDetailsPage({ params }: MatchPageProps) {
  const { id } = await params;
  const match = await fetchFixture(id);

  if (!match) {
    return (
      <main className="pt-2 pb-4 space-y-4">
        <section className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs">
          <h1 className="text-sm font-semibold text-rose-100 mb-1">
            Match not found
          </h1>
          <p className="text-rose-200">
            We couldn't find details for this match. It may be unavailable or
            out of range for your API plan.
          </p>
        </section>
      </main>
    );
  }

  const ctx: MatchAiContext = {
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    status: match.status,
    homeRecentForm: undefined,
    awayRecentForm: undefined,
    h2hSummary: undefined,
    notes:
      "This is the detailed match page in FORZA. Focus on safe and risky betting angles.",
  };

  const aiSummary = await getMatchInsightText(ctx);

  return <MatchDetailsClient match={match} aiSummary={aiSummary} />;
}