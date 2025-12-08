"use client";

import { SlipSocialBar } from "./SlipSocialBar";

type SlipBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds?: number | null;
  kickoffTime?: string | null;
  league?: string | null;
};

type SlipAuthor = {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string | null;
};

type SlipCardProps = {
  slip: {
    id: string;
    bets: SlipBet[];
    totalOdds?: number | null;
  };
  author: SlipAuthor;
  createdAgo?: string;
  onOpenComments: (slipId: string) => void;
};

export function SlipCard({ slip, author, createdAgo, onOpenComments }: SlipCardProps) {
  const authorName =
    author?.displayName && author.displayName.trim().length > 0
      ? author.displayName
      : "FORZA user";

  const authorUsername =
    author?.username && author.username.trim().length > 0
      ? author.username
      : "forzauser";

  const authorPhotoURL = author?.photoURL || null;

  const picksCount = slip.bets.length;

  const totalOdds =
    slip.totalOdds && slip.totalOdds > 0
      ? slip.totalOdds
      : slip.bets.reduce((acc, b) => {
          const o =
            typeof b.odds === "number" && !Number.isNaN(b.odds)
              ? b.odds
              : 1;
          return acc * o;
        }, 1);

  return (
    <article className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3">
      {/* Top row: avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-[#1f262f] flex items-center justify-center text-sm font-semibold overflow-hidden">
          {authorPhotoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorPhotoURL}
              alt={authorName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span>{authorName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">
            {authorName}
          </span>
          <span className="text-xs text-[#98A2B3]">
            @{authorUsername}
          </span>
        </div>
      </div>

      {/* Slip preview */}
      <div className="rounded-3xl bg-[#050505] border border-[var(--forza-accent-soft,#27361a)] px-3.5 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#E4E4E4]">
            Slip preview
          </span>
          <span className="text-[11px] text-[var(--forza-accent)] font-semibold">
            {picksCount}-pick · {totalOdds.toFixed(2)}x
          </span>
        </div>

        <div className="space-y-2 mt-1">
          {slip.bets.map((b, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[11px]"
            >
              <p className="text-white">
                {b.homeTeam}{" "}
                <span className="text-[#777]">vs</span>{" "}
                {b.awayTeam}
              </p>
              <p className="text-[#A8A8A8]">
                {b.market} • {b.selection}
                {typeof b.odds === "number" &&
                  !Number.isNaN(b.odds) && (
                    <span className="text-[var(--forza-accent)]">
                      {" "}
                      @ {b.odds.toFixed(2)}
                    </span>
                  )}
              </p>
              {b.kickoffTime && (
                <p className="text-[10px] text-[#7A7A7A] mt-[2px]">
                  Kickoff:{" "}
                  {new Date(
                    b.kickoffTime
                  ).toLocaleString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <SlipSocialBar
        slipId={slip.id}
        initialLikeCount={0}
        initialCommentCount={0}
        onOpenComments={() => onOpenComments(slip.id)}
      />
    </article>
  );
}