import { fetchFromApiFootball } from "@/lib/apiFootball";
import CommunityPageClient, {
  CommunityInitialMatch,
} from "@/components/CommunityPageClient";
import { demoMatches } from "@/lib/demoData";

async function fetchTodayMatchesForCommunity(): Promise<CommunityInitialMatch[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { date: today },
    });

    const arr: any[] = res?.response ?? [];
    if (!arr.length) {
      return demoMatches.map((m) => ({
        id: Number(m.id),
        homeTeam: m.home,
        awayTeam: m.away,
        league: m.league,
      }));
    }

    return arr.slice(0, 30).map((item) => {
      const fixture = item.fixture ?? {};
      const league = item.league ?? {};
      const teams = item.teams ?? {};

      return {
        id: fixture.id as number,
        homeTeam: teams.home?.name ?? "Home",
        awayTeam: teams.away?.name ?? "Away",
        league: league.name ?? "League",
      };
    });
  } catch (error) {
    console.error("[FORZA] Community fixtures error:", error);
    return demoMatches.map((m) => ({
      id: Number(m.id),
      homeTeam: m.home,
      awayTeam: m.away,
      league: m.league,
    }));
  }
}

export default async function CommunityPage() {
  const matches = await fetchTodayMatchesForCommunity();
  return <CommunityPageClient initialMatches={matches} />;
}