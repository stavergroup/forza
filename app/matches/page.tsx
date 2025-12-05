import Header from "@/components/Header";
import { CalendarDays, SlidersHorizontal, Star } from "lucide-react";

type MatchStatus = "LIVE" | "UPCOMING" | "FT";

type DemoMatch = {
  id: number;
  league: string;
  minuteOrTime: string;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore?: number;
  awayScore?: number;
  followed?: boolean;
};

const demoMatches: DemoMatch[] = [
  {
    id: 1,
    league: "Ligue 1",
    minuteOrTime: "62'",
    status: "LIVE",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    homeAbbr: "PSG",
    awayAbbr: "OM",
    homeScore: 1,
    awayScore: 0,
    followed: true,
  },
  {
    id: 2,
    league: "Premier League",
    minuteOrTime: "18:30",
    status: "UPCOMING",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeAbbr: "ARS",
    awayAbbr: "CHE",
  },
  {
    id: 3,
    league: "Serie A",
    minuteOrTime: "FT",
    status: "FT",
    homeTeam: "Inter",
    awayTeam: "AC Milan",
    homeAbbr: "INT",
    awayAbbr: "ACM",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: 4,
    league: "La Liga",
    minuteOrTime: "23:00",
    status: "UPCOMING",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    homeAbbr: "BAR",
    awayAbbr: "RM",
    followed: true,
  },
];

export default function MatchesPage() {
  const liveMatches = demoMatches.filter((m) => m.status === "LIVE");

  return (
    <>
      <Header />
      <div className="p-4 space-y-4 text-sm">
        {/* Day selector */}
        <section className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-1 bg-[#050505] border border-[#1F1F1F] rounded-full px-1 py-1 text-[11px]">
            <button className="flex-1 rounded-full bg-[#111111] text-white py-1.5">
              Today
            </button>
            <button className="flex-1 rounded-full text-[#888] py-1.5">
              Tomorrow
            </button>
            <button className="flex-1 rounded-full text-[#888] py-1.5">
              Weekend
            </button>
          </div>
          <button className="ml-1 h-8 w-8 flex items-center justify-center rounded-full border border-[#1F1F1F] bg-[#050505]">
            <CalendarDays size={16} className="stroke-[#B5B5B5]" />
          </button>
        </section>

        {/* League + filter bar */}
        <section className="flex items-center justify-between gap-2 text-[11px]">
          <button className="flex items-center gap-1 rounded-full bg-[#111111] border border-[#1F1F1F] px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A4FF2F]" />
            <span className="text-[#B5B5B5]">All leagues</span>
          </button>
          <button className="flex items-center gap-1 rounded-full bg-[#050505] border border-[#1F1F1F] px-2.5 py-1.5 text-[#B5B5B5]">
            <SlidersHorizontal size={14} className="stroke-[#B5B5B5]" />
            <span>Filters</span>
          </button>
        </section>

        {/* Live now strip */}
        {liveMatches.length > 0 && (
          <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] px-3 py-2 text-[11px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D4D]" />
              <span className="uppercase tracking-[0.18em] text-[#B5B5B5]">
                Live now
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {liveMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex-shrink-0 min-w-[150px] rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2"
                >
                  <p className="text-[10px] text-[#888] mb-1">{m.league}</p>
                  <p className="text-[11px] text-[#E5E5E5]">
                    {m.homeTeam} {m.homeScore} - {m.awayScore} {m.awayTeam}
                  </p>
                  <p className="text-[10px] text-[#A4FF2F] mt-0.5">
                    {m.minuteOrTime}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main fixtures list - compact rows with star icon */}
        <section className="space-y-0.5">
          {demoMatches.map((m) => (
            <div
              key={m.id}
              className="px-3 py-2.5 rounded-xl bg-[#050505] border border-[#111111] flex gap-3 items-center"
            >
              {/* Time / minute column */}
              <div className="w-11 text-[11px]">
                <span
                  className={
                    m.status === "LIVE"
                      ? "text-[#A4FF2F]"
                      : "text-[#B5B5B5]"
                  }
                >
                  {m.status === "FT" ? "FT" : m.minuteOrTime}
                </span>
              </div>

              {/* Teams + league */}
              <div className="flex-1">
                <p className="text-[10px] text-[#777] mb-1">{m.league}</p>
                {/* Home row */}
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-6 w-6 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[9px] text-[#A4FF2F]">
                      {m.homeAbbr}
                    </div>
                    <span className="text-[#E5E5E5] truncate">
                      {m.homeTeam}
                    </span>
                  </div>
                  <div className="w-6 text-right text-[12px] text-[#E5E5E5]">
                    {m.homeScore !== undefined ? m.homeScore : "-"}
                  </div>
                </div>
                {/* Away row */}
                <div className="flex items-center justify-between text-[12px] mt-0.5">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-6 w-6 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[9px] text-[#B5B5B5]">
                      {m.awayAbbr}
                    </div>
                    <span className="text-[#B5B5B5] truncate">
                      {m.awayTeam}
                    </span>
                  </div>
                  <div className="w-6 text-right text-[12px] text-[#E5E5E5]">
                    {m.awayScore !== undefined ? m.awayScore : "-"}
                  </div>
                </div>
              </div>

              {/* Star follow icon */}
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#1F1F1F] bg-[#050505] hover:bg-[#111111] active:scale-95 transition"
                aria-label="Follow match"
              >
                <Star
                  size={16}
                  className={
                    m.followed ? "fill-[#A4FF2F] stroke-[#A4FF2F]" : "stroke-[#B5B5B5]"
                  }
                />
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}