import Header from "@/components/Header";

type MatchStatus = "LIVE" | "UPCOMING" | "FT";

export type UiMatch = {
  id: number;
  league: string;
  minuteOrTime: string;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    name: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

async function fetchMatches(date: string): Promise<{ matches: UiMatch[]; error?: string }> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const baseUrl =
    process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    console.error("[FORZA] Missing API_FOOTBALL_KEY env variable");
    return { matches: [], error: "API key not configured." };
  }

  try {
    const url = `${baseUrl}/fixtures?date=${date}&timezone=Africa/Dar_es_Salaam`;
    const res = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[FORZA] API-Football error:", res.status, body);
      return {
        matches: [],
        error: `API error: ${res.status}`,
      };
    }

    const json = await res.json();
    const fixtures: ApiFixture[] = json.response || [];

    const matches: UiMatch[] = fixtures.map((f) => {
      const short = f.fixture.status.short;
      const elapsed = f.fixture.status.elapsed;
      const leagueName = f.league?.name || "Unknown league";

      let status: MatchStatus = "UPCOMING";
      if (short === "FT" || short === "AET" || short === "PEN") {
        status = "FT";
      } else if (["1H", "2H", "ET", "LIVE"].includes(short)) {
        status = "LIVE";
      } else {
        status = "UPCOMING";
      }

      let minuteOrTime = "";
      if (status === "LIVE" && typeof elapsed === "number") {
        minuteOrTime = `${elapsed}'`;
      } else if (status === "FT") {
        minuteOrTime = "FT";
      } else {
        const dateObj = new Date(f.fixture.date);
        minuteOrTime = dateObj
          .toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
      }

      const homeName = f.teams.home?.name || "Home";
      const awayName = f.teams.away?.name || "Away";

      const makeAbbr = (name: string) =>
        name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase();

      return {
        id: f.fixture.id,
        league: leagueName,
        minuteOrTime,
        status,
        homeTeam: homeName,
        awayTeam: awayName,
        homeAbbr: makeAbbr(homeName),
        awayAbbr: makeAbbr(awayName),
        homeScore: f.goals.home,
        awayScore: f.goals.away,
      };
    });

    return { matches };
  } catch (err) {
    console.error("[FORZA] Failed to fetch matches:", err);
    return { matches: [], error: "Failed to load matches." };
  }
}

type MatchesPageProps = {
  searchParams: Promise<{ date?: string }>;
};

function formatYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = formatYMD(todayDate);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const tomorrow = formatYMD(tomorrowDate);

  const weekendDate = new Date(todayDate);
  const day = weekendDate.getDay(); // 0-6, Sunday=0
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  weekendDate.setDate(weekendDate.getDate() + daysUntilSaturday);
  const weekend = formatYMD(weekendDate);

  const params = await searchParams;
  const requested = params?.date;
  const selectedDate =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;

  let activePeriod: "today" | "tomorrow" | "weekend" | "custom" = "custom";
  if (selectedDate === today) activePeriod = "today";
  else if (selectedDate === tomorrow) activePeriod = "tomorrow";
  else if (selectedDate === weekend) activePeriod = "weekend";

  const { matches, error } = await fetchMatches(selectedDate);

  const MatchesClient = (await import("@/components/MatchesClient")).default;

  return (
    <>
      <Header />
      <div className="p-4">
        <MatchesClient
          initialMatches={matches}
          error={error}
          selectedDate={selectedDate}
          activePeriod={activePeriod}
          today={today}
          tomorrow={tomorrow}
          weekend={weekend}
        />
      </div>
    </>
  );
}