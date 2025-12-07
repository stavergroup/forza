"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import CommentsSheet from "@/components/CommentsSheet";
import { SlipSocialBar } from "@/components/SlipSocialBar";

type SlipBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds?: number | null;
  kickoffTime?: string | null;
  league?: string | null;
};

type SlipDoc = {
  id?: string;
  userId: string;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets: SlipBet[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
  totalOdds?: number | null;
  likeCount?: number;
  commentsCount?: number;
};

type SavedSlipDoc = {
  slipId: string;
  createdAt?: any;
};

function timeAgoFromTimestamp(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function initialsFromName(name?: string) {
  if (!name) return "FZ";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[1].charAt(0).toUpperCase()
  );
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedSlips, setSavedSlips] = useState<SavedSlipDoc[]>([]);
  const [slips, setSlips] = useState<SlipDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlipForComments, setSelectedSlipForComments] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "savedSlips"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        const saved = snapshot.docs.map((d) => ({
          slipId: d.id,
          ...d.data(),
        })) as SavedSlipDoc[];

        setSavedSlips(saved);

        // Fetch full slips
        const slipPromises = saved.map(async (savedSlip) => {
          try {
            const slipSnap = await getDoc(doc(db, "slips", savedSlip.slipId));
            if (slipSnap.exists()) {
              return { id: slipSnap.id, ...slipSnap.data() } as SlipDoc;
            }
          } catch (err) {
            console.error("[FORZA] error fetching slip", savedSlip.slipId, err);
          }
          return null;
        });

        const fetchedSlips = (await Promise.all(slipPromises)).filter(Boolean) as SlipDoc[];
        setSlips(fetchedSlips);
        setLoading(false);
      },
      (error) => {
        console.error("[FORZA] saved slips subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <>
        <Header />
        <div className="p-4 space-y-4 text-sm">
          <div className="text-center space-y-4">
            <p className="text-[16px] text-[#E5E5E5] font-semibold">
              Sign in to see your saved slips
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-2 rounded-full bg-[var(--forza-accent)] text-black font-semibold hover:brightness-95 active:scale-[0.97] transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="p-4 space-y-5 text-sm">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-[16px] text-[#E5E5E5] font-semibold">
            Saved slips
          </h1>
          <p className="text-[12px] text-[#888]">
            Slips you follow for tracking.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#1F1F1F]" />
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-[#1F1F1F] rounded" />
                    <div className="h-3 w-16 bg-[#1F1F1F] rounded" />
                  </div>
                </div>
                <div className="rounded-3xl bg-[#0B0B0B] border border-[#1F1F1F] p-3 space-y-2">
                  <div className="h-4 w-24 bg-[#1F1F1F] rounded" />
                  <div className="space-y-2">
                    <div className="h-8 w-full bg-[#1F1F1F] rounded-2xl" />
                    <div className="h-8 w-full bg-[#1F1F1F] rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && slips.length === 0 && (
          <div className="text-center space-y-4 py-8">
            <p className="text-[16px] text-[#E5E5E5] font-semibold">
              No saved slips yet
            </p>
            <p className="text-[12px] text-[#888]">
              Tap the star on any slip to follow it.
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="px-6 py-2 rounded-full bg-[#111111] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[var(--forza-accent)] hover:border-[var(--forza-accent)] transition"
            >
              Go to feed
            </button>
          </div>
        )}

        {/* Slips */}
        {!loading && slips.length > 0 && (
          <div className="space-y-3">
            {slips.map((slip) => {
              if (!slip.bets || slip.bets.length === 0) return null;

              const slipId = slip.id || "";
              const createdAgo = timeAgoFromTimestamp(slip.createdAt);

              const profileDisplayName = "FORZA user"; // Since we don't have user data here
              const profileHandle = "";
              const avatarInitial = profileDisplayName.charAt(0).toUpperCase();

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

              const likesCount = slip.likeCount ?? 0;
              const commentsCount = slip.commentsCount ?? 0;

              return (
                <article
                  key={slipId}
                  className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3"
                >
                  {/* Top row: avatar + name + time */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#101010] flex items-center justify-center text-[11px] font-semibold text-white">
                      {avatarInitial}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-white">
                        {profileDisplayName}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                        {profileHandle && <span>{profileHandle}</span>}
                        {createdAgo && (
                          <>
                            {profileHandle && <span>•</span>}
                            <span>{createdAgo}</span>
                          </>
                        )}
                      </div>
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
                    slipId={slipId}
                    initialLikeCount={likesCount}
                    initialCommentCount={commentsCount}
                    onOpenComments={() => setSelectedSlipForComments(slipId)}
                  />

                </article>
              );
            })}
          </div>
        )}

        {/* Comments Sheet */}
        {selectedSlipForComments && (
          <CommentsSheet
            slipId={selectedSlipForComments}
            onClose={() => setSelectedSlipForComments(null)}
          />
        )}
      </div>
    </>
  );
}