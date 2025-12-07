"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";

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
  userId: string;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets: SlipBet[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
  totalOdds?: number | null;
};

type PostDoc = {
  id: string;
  userId: string;
  slipId: string;
  createdAt?: any;
};

type UserProfile = {
  displayName?: string;
  handle?: string;
  avatarColor?: string;
};

type FeedItem = {
  post: PostDoc;
  slip: SlipDoc | null;
  user: UserProfile | null;
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

export default function LiveFeedSection() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const basePosts: PostDoc[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              userId: data.userId,
              slipId: data.slipId,
              createdAt: data.createdAt,
            };
          });

          const enriched: FeedItem[] = await Promise.all(
            basePosts.map(async (post) => {
              let slip: SlipDoc | null = null;
              let user: UserProfile | null = null;
              
              // Skip if slipId or userId is missing
              if (!post.slipId || !post.userId) {
                return { post, slip: null, user: null };
              }
              
              try {
                const [slipSnap, userSnap] = await Promise.all([
                  getDoc(doc(db, "slips", post.slipId)),
                  getDoc(doc(db, "users", post.userId)),
                ]);
                if (slipSnap.exists()) {
                  slip = slipSnap.data() as SlipDoc;
                }
                if (userSnap.exists()) {
                  user = userSnap.data() as UserProfile;
                }
              } catch (err) {
                // Silent fail - just skip this post
              }
              return { post, slip, user };
            })
          );

          setItems(enriched);
        } catch (err) {
          console.error("[FORZA] live feed subscription outer error:", err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("[FORZA] live feed subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <section className="mt-6 space-y-2">
        <h2 className="text-[13px] font-medium text-[#EDEDED]">
          Latest slips (live)
        </h2>
        <p className="text-[12px] text-[#9F9F9F]">
          Loading latest community slips…
        </p>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-6 space-y-2">
        <h2 className="text-[13px] font-medium text-[#EDEDED]">
          Latest slips (live)
        </h2>
        <p className="text-[12px] text-[#9F9F9F]">
          No community slips yet. Post from the Build Slip page.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-[13px] font-medium text-[#EDEDED]">
        Latest slips (live)
      </h2>

      {items.map(({ post, slip, user }) => {
        if (!slip || !slip.bets || slip.bets.length === 0) return null;

        const isMine =
          currentUser && slip.userId === currentUser.uid;

        const displayName =
          (isMine ? "You" : user?.displayName) || "FORZA user";

        const handle =
          user?.handle && !isMine ? `@${user.handle}` : isMine ? "@you" : "";

        const avatarLabel = initialsFromName(user?.displayName || handle);

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

        const createdAgo = timeAgoFromTimestamp(post.createdAt);

        return (
          <article
            key={post.id}
            className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3"
          >
            {/* Top row: avatar + name + time */}
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={{
                  backgroundColor: user?.avatarColor || "#101010",
                  color: "#ffffff",
                }}
              >
                {avatarLabel}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-white">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                  {handle && <span>{handle}</span>}
                  {createdAgo && (
                    <>
                      {handle && <span>•</span>}
                      <span>{createdAgo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Slip preview card (real) */}
            <div className="rounded-3xl bg-[#050505] border border-[var(--forza-accent-soft, #27361a)] px-3.5 py-3 space-y-2">
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

              {/* Save / Build slip row inside card (for later wiring) */}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-full border border-[var(--forza-accent)] text-[12px] text-[var(--forza-accent)] py-1.5"
                >
                  Save slip
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full bg-[var(--forza-accent)] text-[12px] text-black font-semibold py-1.5"
                >
                  Build slip
                </button>
              </div>
            </div>

            {/* Post actions row: Like / Comment / Share / Follow */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-[#A0A0A0]">
              <button
                type="button"
                className="flex items-center gap-1"
              >
                ♡ <span>Like</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1"
              >
                💬 <span>Comment</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1"
              >
                ↗ <span>Share</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 text-[var(--forza-accent)]"
              >
                ★ <span>Follow</span>
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}