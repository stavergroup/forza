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
import { SlipCard } from "./SlipCard";
import Link from "next/link";

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

        const author = isMine
          ? {
              id: currentUser.uid,
              displayName: currentUser.displayName || "You",
              username: "you",
              photoURL: currentUser.photoURL || null,
            }
          : {
              id: post.userId,
              displayName: user?.displayName || user?.handle || "FORZA user",
              username: user?.handle || "forzauser",
              photoURL: user?.photoURL || null,
            };

        return (
          <SlipCard
            key={post.id}
            slip={{ ...slip, id: slipId }}
            author={author}
            onOpenComments={setSelectedSlipForComments}
          />
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