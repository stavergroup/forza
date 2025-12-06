"use client";

import { useEffect, useState } from "react";
// import Header from "@/components/Header";

type MatchStatus = "LIVE" | "UPCOMING" | "FT";

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league: {
    name: string;
    country?: string;
    round?: string;
  };
  teams: {
    home: { name: string; logo?: string };
    away: { name: string; logo?: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type UiMatchDetail = {
  id: number;
  league: string;
  country?: string;
  round?: string;
  dateTime: string;
  venue?: string;
  status: MatchStatus;
  minuteOrTime: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

async function fetchMatchDetail(
  id: string,
): Promise<{ match: UiMatchDetail | null; error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY || "efde07db5eae315058045a2ec397565d";
  const baseUrl =
    process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

  try {
    const url = `${baseUrl}/fixtures?id=${id}&timezone=Africa/Dar_es_Salaam`;
    const res = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[FORZA] API-Football detail error:", res.status, body);
      return {
        match: null,
        error: `API error: ${res.status}`,
      };
    }

    const json = await res.json();
    const fixture: ApiFixture | undefined = json.response?.[0];

    if (!fixture) {
      return { match: null, error: "Match not found." };
    }

    const short = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

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
      const d = new Date(fixture.fixture.date);
      minuteOrTime = d
        .toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
    }

    const d = new Date(fixture.fixture.date);
    const dateTime = d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const venueName = fixture.fixture.venue?.name || "";
    const venueCity = fixture.fixture.venue?.city || "";
    const venue =
      venueName && venueCity ? `${venueName}, ${venueCity}` : venueName || venueCity || undefined;

    const match: UiMatchDetail = {
      id: fixture.fixture.id,
      league: fixture.league?.name || "Unknown league",
      country: fixture.league?.country,
      round: fixture.league?.round,
      dateTime,
      venue,
      status,
      minuteOrTime,
      homeTeam: fixture.teams.home?.name || "Home",
      awayTeam: fixture.teams.away?.name || "Away",
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
    };

    return { match };
  } catch (err) {
    console.error("[FORZA] Failed to fetch match detail:", err);
    return { match: null, error: "Failed to load match details." };
  }
}

type MatchDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default function MatchDetailsPage({ params }: MatchDetailsPageProps) {
  const [match, setMatch] = useState<UiMatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchMatchDetail(id).then(({ match: m, error: e }) => {
      setMatch(m);
      setError(e || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="p-4 bg-[#0A0A0A] text-white border-b border-[#1F1F1F]">Match Details</div>
        <div className="p-4 text-sm">Loading match details...</div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 bg-[#0A0A0A] text-white border-b border-[#1F1F1F]">Match Details</div>
      <div className="p-4 space-y-4 text-sm">
        {/* Error / not found */}
        {!match && (
          <section className="rounded-2xl bg-[#111111] border border-[#402020] p-3 text-[11px] text-[#FF8888]">
            <p>Couldn't load match details: {error || "Unknown error"}</p>
          </section>
        )}

        {match && (
          <>
            {/* Main match card */}
            <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#B5B5B5]">
                <div>
                  <p>{match.league}</p>
                  {match.round && (
                    <p className="text-[#777] mt-0.5">{match.round}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>{match.dateTime}</p>
                  {match.venue && (
                    <p className="text-[#777] mt-0.5 truncate max-w-[140px]">
                      {match.venue}
                    </p>
                  )}
                </div>
              </div>

              {/* Score row */}
              <div className="flex items-center justify-between">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[11px] text-[var(--forza-accent)]">
                    {match.homeTeam
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                  <p className="text-[12px] text-[#E5E5E5] text-center px-1 truncate max-w-[120px]">
                    {match.homeTeam}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <p className="text-[11px] text-[#777] uppercase tracking-[0.16em]">
                    {match.status === "LIVE"
                      ? "LIVE"
                      : match.status === "FT"
                      ? "FULL TIME"
                      : "SCHEDULED"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] font-semibold text-[#E5E5E5]">
                      {match.homeScore ?? "-"}
                    </span>
                    <span className="text-[20px] font-semibold text-[#E5E5E5]">
                      -
                    </span>
                    <span className="text-[20px] font-semibold text-[#E5E5E5]">
                      {match.awayScore ?? "-"}
                    </span>
                  </div>
                  <p
                    className={
                      match.status === "LIVE"
                        ? "text-[11px] text-[var(--forza-accent)]"
                        : "text-[11px] text-[#888]"
                    }
                  >
                    {match.minuteOrTime}
                  </p>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[11px] text-[#B5B5B5]">
                    {match.awayTeam
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                  <p className="text-[12px] text-[#E5E5E5] text-center px-1 truncate max-w-[120px]">
                    {match.awayTeam}
                  </p>
                </div>
              </div>
            </section>

            {/* Placeholder for tabs: Summary / Stats / AI */}
            <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-2">
              <div className="flex gap-1 text-[11px] mb-2">
                <button className="flex-1 rounded-full bg-[#111111] border border-[#1F1F1F] py-1.5 text-[#E5E5E5]">
                  Summary
                </button>
                <button className="flex-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] py-1.5 text-[#888]">
                  Stats (soon)
                </button>
                <button className="flex-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] py-1.5 text-[#888]">
                  AI slip (soon)
                </button>
              </div>

              <div className="space-y-1.5 text-[12px] text-[#CCCCCC]">
                <p>
                  This is a basic match view powered by API-Football. Later we
                  can plug:
                </p>
                <ul className="list-disc list-inside text-[11px] text-[#AAAAAA] space-y-0.5">
                  <li>Live stats (shots, corners, cards)</li>
                  <li>Lineups and player ratings</li>
                  <li>AI-generated match summary and bet ideas</li>
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}