import { NextResponse } from "next/server";
import { fetchFromApiFootball } from "@/lib/apiFootball";

type ApiFixture = {
  id: number;
  league: string;
  leagueShort?: string;
  time: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
};

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const res = await fetchFromApiFootball<any>({
      path: "/fixtures",
      searchParams: { date: today },
    });

    const arr: any[] = res?.response ?? [];
    const fixtures: ApiFixture[] = arr.map((item) => {
      const fixture = item.fixture ?? {};
      const league = item.league ?? {};
      const teams = item.teams ?? {};

      return {
        id: fixture.id as number,
        league: league.name ?? "Unknown league",
        leagueShort: league.round ?? undefined,
        time: fixture.date
          ? new Date(fixture.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        status: fixture.status?.short ?? "NS",
        homeTeam: teams.home?.name ?? "Home",
        awayTeam: teams.away?.name ?? "Away",
      };
    });

    return NextResponse.json({ fixtures });
  } catch (error) {
    console.error("[FORZA] community/today-fixtures error:", error);
    return NextResponse.json({ fixtures: [] });
  }
}