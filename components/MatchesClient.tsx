"use client";

import { CalendarDays, SlidersHorizontal, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { UiMatch } from "@/app/matches/page";

type Props = {
  initialMatches: UiMatch[];
  error?: string;
  selectedDate: string;
  activePeriod: "today" | "tomorrow" | "weekend" | "custom";
  today: string;
  tomorrow: string;
  weekend: string;
};

const FOLLOW_KEY = "forza_followed_match_ids";

export default function MatchesClient({
  initialMatches,
  error,
  selectedDate,
  activePeriod,
  today,
  tomorrow,
  weekend,
}: Props) {
  const router = useRouter();

  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [leagueIndex, setLeagueIndex] = useState(0);

  // Load followed IDs from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FOLLOW_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFollowedIds(parsed);
        }
      }
    } catch (err) {
      console.error("[FORZA] Failed to read followed matches from localStorage", err);
    }
  }, []);

  // Save followed IDs when they change
  useEffect(() => {
    try {
      window.localStorage.setItem(FOLLOW_KEY, JSON.stringify(followedIds));
    } catch (err) {
      console.error("[FORZA] Failed to save followed matches to localStorage", err);
    }
  }, [followedIds]);

  // League options
  const leagueOptions = useMemo(() => {
    const set = new Set<string>();
    initialMatches.forEach((m) => {
      if (m.league) set.add(m.league);
    });
    const arr = Array.from(set);
    return ["All leagues", ...arr];
  }, [initialMatches]);

  const selectedLeagueLabel = leagueOptions[leagueIndex] || "All leagues";
  const selectedLeague =
    selectedLeagueLabel === "All leagues" ? null : selectedLeagueLabel;

  const matchesWithFollow = initialMatches.map((m) => ({
    ...m,
    followed: followedIds.includes(m.id),
  }));

  const filteredMatches = matchesWithFollow.filter((m) =>
    selectedLeague ? m.league === selectedLeague : true,
  );

  const liveMatches = filteredMatches.filter((m) => m.status === "LIVE");

  const handleDayClick = (target: "today" | "tomorrow" | "weekend") => {
    const date =
      target === "today" ? today : target === "tomorrow" ? tomorrow : weekend;
    router.push(`/matches?date=${date}`);
  };

  const handleLeagueCycle = () => {
    setLeagueIndex((prev) =>
      leagueOptions.length === 0 ? 0 : (prev + 1) % leagueOptions.length,
    );
  };

  const toggleFollow = (id: number) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const openMatch = (id: number) => {
    router.push(`/matches/${id}`);
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Day selector */}
      <section className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-1 bg-[#050505] border border-[#1F1F1F] rounded-full px-1 py-1 text-[11px]">
          <button
            className={`flex-1 rounded-full py-1.5 ${
              activePeriod === "today"
                ? "bg-[#111111] text-white"
                : "text-[#888]"
            }`}
            onClick={() => handleDayClick("today")}
          >
            Today
          </button>
          <button
            className={`flex-1 rounded-full py-1.5 ${
              activePeriod === "tomorrow"
                ? "bg-[#111111] text-white"
                : "text-[#888]"
            }`}
            onClick={() => handleDayClick("tomorrow")}
          >
            Tomorrow
          </button>
          <button
            className={`flex-1 rounded-full py-1.5 ${
              activePeriod === "weekend"
                ? "bg-[#111111] text-white"
                : "text-[#888]"
            }`}
            onClick={() => handleDayClick("weekend")}
          >
            Weekend
          </button>
        </div>
        <button className="ml-1 h-8 w-8 flex items-center justify-center rounded-full border border-[#1F1F1F] bg-[#050505]">
          <CalendarDays size={16} className="stroke-[#B5B5B5]" />
        </button>
      </section>

      {/* League + filter bar */}
      <section className="flex items-center justify-between gap-2 text-[11px]">
        <button
          className="flex items-center gap-1 rounded-full bg-[#111111] border border-[#1F1F1F] px-3 py-1.5"
          onClick={handleLeagueCycle}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--forza-accent)]" />
          <span className="text-[#B5B5B5] truncate max-w-[130px]">
            {selectedLeagueLabel}
          </span>
        </button>
        <button className="flex items-center gap-1 rounded-full bg-[#050505] border border-[#1F1F1F] px-2.5 py-1.5 text-[#B5B5B5]">
          <SlidersHorizontal size={14} className="stroke-[#B5B5B5]" />
          <span>Filters</span>
        </button>
      </section>

      {/* Error / Empty state */}
      {error && (
        <section className="rounded-2xl bg-[#111111] border border-[#402020] p-3 text-[11px] text-[#FF8888]">
          <p>Couldn't load matches: {error}</p>
          <p className="text-[#999] mt-1">
            Check your API_FOOTBALL_KEY settings or try again later.
          </p>
        </section>
      )}

      {/* Live now strip */}
      {liveMatches.length > 0 && !error && (
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
                  {m.homeTeam} {m.homeScore ?? "-"} - {m.awayScore ?? "-"}{" "}
                  {m.awayTeam}
                </p>
                <p className="text-[10px] text-[var(--forza-accent)] mt-0.5">
                  {m.minuteOrTime}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main fixtures list - compact rows with star icon */}
      {!error && (
        <section className="space-y-0.5">
          {filteredMatches.length === 0 && (
            <p className="text-[11px] text-[#777] px-1">
              No fixtures found for this date.
            </p>
          )}

          {filteredMatches.map((m) => (
            <div
              key={m.id}
              className="px-3 py-2.5 rounded-xl bg-[#050505] border border-[#111111] flex gap-3 items-center cursor-pointer hover:bg-[#101010] transition"
              onClick={() => openMatch(m.id)}
            >
              {/* Time / minute column */}
              <div className="w-11 text-[11px]">
                <span
                  className={
                    m.status === "LIVE" ? "text-[var(--forza-accent)]" : "text-[#B5B5B5]"
                  }
                >
                  {m.minuteOrTime}
                </span>
              </div>

              {/* Teams + league */}
              <div className="flex-1">
                <p className="text-[10px] text-[#777] mb-1">{m.league}</p>
                {/* Home row */}
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-6 w-6 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[9px] text-[var(--forza-accent)]">
                      {m.homeAbbr}
                    </div>
                    <span className="text-[#E5E5E5] truncate">
                      {m.homeTeam}
                    </span>
                  </div>
                  <div className="w-6 text-right text-[12px] text-[#E5E5E5]">
                    {m.homeScore ?? "-"}
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
                    {m.awayScore ?? "-"}
                  </div>
                </div>
              </div>

              {/* Star follow icon (localStorage) */}
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#1F1F1F] bg-[#050505] hover:bg-[#111111] active:scale-95 transition"
                aria-label="Follow match"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(m.id);
                }}
              >
                <Star
                  size={16}
                  className={
                    m.followed
                      ? "fill-[var(--forza-accent)] stroke-[var(--forza-accent)]"
                      : "stroke-[#B5B5B5]"
                  }
                />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Selected date info */}
      <p className="text-[10px] text-[#555] px-1">
        Showing fixtures for <span className="text-[#B5B5B5]">{selectedDate}</span>.
      </p>
    </div>
  );
}