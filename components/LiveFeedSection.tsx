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
import {
  toggleSlipLike,
  hasLikedSlip,
  addSlipComment,
  toggleFollowUser,
  isFollowingUser,
} from "@/lib/firestoreSocial";

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

function SlipCard({ post, slip, user }: FeedItem) {
  const currentUser = auth.currentUser;
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const currentUserId = currentUser?.uid;
  const slipId = post.slipId;
  const slipOwnerId = slip?.userId;

  useEffect(() => {
    if (!currentUserId || !slipId) return;
    let cancelled = false;

    (async () => {
      try {
        const liked = await hasLikedSlip({ slipId, userId: currentUserId });
        if (!cancelled) setIsLiked(liked);

        if (slipOwnerId && slipOwnerId !== currentUserId) {
          const following = await isFollowingUser({
            followerId: currentUserId,
            followingId: slipOwnerId,
          });
          if (!cancelled) setIsFollowing(following);
        }
      } catch {
        // Silent fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, slipId, slipOwnerId]);

  const handleToggleLike = async () => {
    if (!currentUserId || !slipId) return;
    setPending(true);
    try {
      await toggleSlipLike({ slipId, userId: currentUserId });
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } finally {
      setPending(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId || !slipOwnerId || currentUserId === slipOwnerId) return;
    setPending(true);
    try {
      await toggleFollowUser({
        followerId: currentUserId,
        followingId: slipOwnerId,
      });
      setIsFollowing((prev) => !prev);
      setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
    } finally {
      setPending(false);
    }
  };

  const handleShare = () => {
    setSharesCount((prev) => prev + 1);
    const url =
      typeof window !== "undefined"
        ? window.location.origin + "/feed?slip=" + slipId
        : "";

    const text = "Check this FORZA slip I found";

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any)
        .share({ title: "FORZA slip", text, url })
        .catch(() => {});
    } else if (
      typeof navigator !== "undefined" &&
      (navigator as any).clipboard
    ) {
      (navigator as any).clipboard.writeText(url).catch(() => {});
      alert("Link copied to clipboard");
    }
  };

  if (!slip || !slip.bets || slip.bets.length === 0) return null;

  const isMine = currentUser && slip.userId === currentUser.uid;

  const firestoreName = user?.displayName;
  const authName = isMine ? currentUser?.displayName || undefined : undefined;

  const displayName =
    authName || firestoreName || (isMine ? "You" : "FORZA user");

  const handle =
    user?.handle && !isMine ? `@${user.handle}` : isMine ? "@you" : "";

  const avatarLabel = initialsFromName(displayName || handle);

  const photo = (isMine ? currentUser?.photoURL : user?.photoURL) || null;

  const picksCount = slip.bets.length;

  const totalOdds =
    slip.totalOdds && slip.totalOdds > 0
      ? slip.totalOdds
      : slip.bets.reduce((acc, b) => {
          const o =
            typeof b.odds === "number" && !Number.isNaN(b.odds) ? b.odds : 1;
          return acc * o;
        }, 1);

  const createdAgo = timeAgoFromTimestamp(post.createdAt);

  return (
    <article className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3">
      {/* Top row: avatar + name + time */}
      <div className="flex items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt="avatar"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{
              backgroundColor: user?.avatarColor || "#101010",
              color: "#ffffff",
            }}
          >
            {avatarLabel}
          </div>
        )}

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

      {/* Slip preview card */}
      <div className="rounded-3xl bg-[#050505] border border-[var(--forza-accent-soft,#27361a)] px-3.5 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#E4E4E4]">Slip preview</span>
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
                {b.homeTeam} <span className="text-[#777]">vs</span>{" "}
                {b.awayTeam}
              </p>
              <p className="text-[#A8A8A8]">
                {b.market} • {b.selection}
                {typeof b.odds === "number" && !Number.isNaN(b.odds) && (
                  <span className="text-[var(--forza-accent)]">
                    {" "}
                    @ {b.odds.toFixed(2)}
                  </span>
                )}
              </p>
              {b.kickoffTime && (
                <p className="text-[10px] text-[#7A7A7A] mt-[2px]">
                  Kickoff:{" "}
                  {new Date(b.kickoffTime).toLocaleString(undefined, {
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

      {/* Actions Row */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 px-2">
        {/* LIKE */}
        <button
          onClick={handleToggleLike}
          disabled={pending || !currentUserId}
          className="flex flex-col items-center flex-1 disabled:opacity-50"
        >
          <span
            className={`text-lg ${
              isLiked ? "text-[#a4ff2f]" : "text-slate-500"
            }`}
          >
            ♥
          </span>
          <span className="mt-0.5">{likesCount ?? 0}</span>
        </button>

        {/* COMMENT */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center flex-1"
        >
          <span className="text-lg">💬</span>
          <span className="mt-0.5">{commentsCount ?? 0}</span>
        </button>

        {/* SHARE */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center flex-1"
        >
          <span className="text-lg">↗</span>
          <span className="mt-0.5">{sharesCount ?? 0}</span>
        </button>

        {/* FOLLOW */}
        <button
          onClick={handleToggleFollow}
          disabled={
            pending || !currentUserId || currentUserId === slipOwnerId
          }
          className="flex flex-col items-center flex-1 disabled:opacity-50"
        >
          <span
            className={`text-lg ${
              isFollowing ? "text-[#a4ff2f]" : "text-slate-500"
            }`}
          >
            ★
          </span>
          <span className="mt-0.5">{followersCount ?? 0}</span>
        </button>
      </div>
    </article>
  );
}

export default function LiveFeedSection() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

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

              // Skip if missing required IDs
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
              } catch {
                // Silent fail - just return null slip/user
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

      {items.map((item) => (
        <SlipCard key={item.post.id} {...item} />
      ))}
    </section>
  );
}