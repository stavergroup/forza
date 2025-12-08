"use client";

import { SlipSocialBar } from "./SlipSocialBar";

type SlipSelection = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  pick: string;
  odd?: number | null;
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
    selections?: SlipSelection[]; // New format
    bets?: any[]; // Old format (backward compatibility)
    totalOdds?: number | null;
  };
  author?: SlipAuthor;
  createdAgo?: string;
  onOpenComments?: (slipId: string) => void;
  compact?: boolean;
};

export function SlipCard({ slip, author, createdAgo, onOpenComments, compact }: SlipCardProps) {
  const authorName =
    author?.displayName && author.displayName.trim().length > 0
      ? author.displayName
      : "FORZA user";

  const authorUsername =
    author?.username && author.username.trim().length > 0
      ? author.username
      : "forzauser";

  const authorPhotoURL = author?.photoURL || null;

  // Backward compatibility: handle both selections (new) and bets (old)
  const selections = slip.selections || (slip as any).bets || [];
  const picksCount = selections.length;

  const totalOdds =
    slip.totalOdds && slip.totalOdds > 0
      ? slip.totalOdds
      : selections.reduce((acc: number, b: any) => {
          const o =
            typeof (b.odd || b.odds) === "number" && !Number.isNaN(b.odd || b.odds)
              ? (b.odd || b.odds)
              : 1;
          return acc * o;
        }, 1);

  const containerClasses = compact
    ? "rounded-2xl bg-[#050505] border border-[#151515] p-2 space-y-2"
    : "rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3";

  return (
    <article className={containerClasses}>
      {/* Top row: avatar + name */}
      {!compact && author && (
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
      )}

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
          {selections.map((b: any, idx: number) => (
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
                {b.market} • {b.pick || (b as any).selection}
                {typeof (b.odd || (b as any).odds) === "number" &&
                  !Number.isNaN(b.odd || (b as any).odds) && (
                    <span className="text-[var(--forza-accent)]">
                      {" "}
                      @ {(b.odd || (b as any).odds).toFixed(2)}
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

      {!compact && onOpenComments && (
        <SlipSocialBar
          slipId={slip.id}
          initialLikeCount={0}
          initialCommentCount={0}
          onOpenComments={() => onOpenComments(slip.id)}
        />
      )}
    </article>
  );
}