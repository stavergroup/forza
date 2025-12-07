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
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  deleteDoc,
  where,
} from "firebase/firestore";
import CommentsSheet from "./CommentsSheet";
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
  photoURL?: string;
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

  // Social state maps keyed by slipId
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  // Comments sheet state
  const [selectedSlipForComments, setSelectedSlipForComments] = useState<string | null>(null);

  useEffect(() => {
    // GLOBAL FEED: no filter by userId
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const basePosts = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              userId: data.userId as string,
              slipId: data.slipId as string,
              createdAt: data.createdAt,
            };
          });

          const enriched = await Promise.all(
            basePosts.map(async (post) => {
              let slip: any = null;
              let user: any = null;

              if (!post.slipId || !post.userId) {
                return { post, slip: null, user: null };
              }

              try {
                const [slipSnap, userSnap] = await Promise.all([
                  getDoc(doc(db, "slips", post.slipId)),
                  getDoc(doc(db, "users", post.userId)),
                ]);

                if (slipSnap.exists()) {
                  const data = slipSnap.data();
                  if (data) {
                    slip = { id: slipSnap.id, ...data };
                  }
                }

                if (userSnap.exists()) {
                  user = userSnap.data();
                }
              } catch (err) {
                console.error("[FORZA] error loading slip/user for post", post.id, err);
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
  }, []); // 👈 IMPORTANT: no currentUser dependency

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

        const slipId = slip.id || post.slipId;
        const isMine = currentUser && post.userId === currentUser.uid;

        const createdAgo = timeAgoFromTimestamp(post.createdAt);

        const profileDisplayName =
          isMine
            ? (currentUser?.displayName || user?.displayName || "You")
            : (user?.displayName || user?.handle || "FORZA user");

        const profileHandle =
          isMine
            ? "@you"
            : (user?.handle ? `@${user.handle}` : "");

        const avatarPhoto =
          isMine
            ? (currentUser?.photoURL || user?.photoURL || null)
            : (user?.photoURL || null);

        const avatarInitial = (profileDisplayName || "F")
          .trim()
          .charAt(0)
          .toUpperCase();

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

        const likesCount = likesCounts[slipId] ?? 0;
        const commentsCount = commentsCounts[slipId] ?? 0;
        const isFollowing = followingState[slipId] ?? false;
        const sharesCount = 0;

        const handleToggleFollow = () => {
          const next = !isFollowing;
          setFollowingState(prev => ({ ...prev, [slipId]: next }));
        };

        const handleShare = () => {
          if (typeof window === "undefined" || !slipId) return;
          const url = `${window.location.origin}/feed?slip=${slipId}`;
          const text = "Check this FORZA slip";
          if ((navigator as any).share) {
            (navigator as any)
              .share({ title: "FORZA slip", text, url })
              .catch(() => {});
          } else if ((navigator as any).clipboard?.writeText) {
            (navigator as any).clipboard
              .writeText(url)
              .then(() => alert("Link copied"))
              .catch(() => {});
          }
        };


        return (
          <article
            key={post.id}
            className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3"
          >
            {/* Top row: avatar + name + time */}
            <div className="flex items-center gap-3">
              {avatarPhoto ? (
                <img
                  src={avatarPhoto}
                  alt={profileDisplayName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#101010] flex items-center justify-center text-[11px] font-semibold text-white">
                  {avatarInitial}
                </div>
              )}

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

      {/* Comments Sheet */}
      {selectedSlipForComments && (
        <CommentsSheet
          slipId={selectedSlipForComments}
          onClose={() => setSelectedSlipForComments(null)}
        />
      )}
    </section>
  );
}