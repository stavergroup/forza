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
import LoadingSkeleton from "./LoadingSkeleton";

type SlipSelection = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  pick: string;
  odd?: number | null;
  kickoffTime?: string | null;
  league?: string | null;
};

type SlipDoc = {
  id: string;
  userId: string;
  totalOdds?: number | null;
  selections: SlipSelection[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
  likeCount?: number;
  commentsCount?: number;
};

type PostDoc = {
  id: string;
  userId: string;
  text?: string; // New posts have text
  slipId?: string; // Old posts have slipId
  type?: string; // Old posts have type: "slip"
  attachedSlipId?: string | null; // New posts have attachedSlipId
  attachedSlipSummary?: {
    totalOdds: number;
    totalPicks: number;
  } | null;
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
  attachedSlip: SlipDoc | null;
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
              text: data.text || (data.type === "slip" ? "Posted a slip" : ""), // Backward compatibility
              slipId: data.slipId, // Keep for backward compatibility
              type: data.type, // Keep for backward compatibility
              attachedSlipId: data.attachedSlipId || data.slipId || null, // Use attachedSlipId or fallback to slipId
              attachedSlipSummary: data.attachedSlipSummary || null,
              createdAt: data.createdAt,
            };
          });

          const enriched = await Promise.all(
            basePosts.map(async (post) => {
              let attachedSlip: any = null;
              let user: any = null;

              if (!post.userId) {
                return { post, attachedSlip: null, user: null };
              }

              try {
                const promises = [getDoc(doc(db, "users", post.userId))];
                if (post.attachedSlipId) {
                  promises.push(getDoc(doc(db, "slips", post.attachedSlipId)));
                }

                const [userSnap, slipSnap] = await Promise.all(promises);

                if (userSnap.exists()) {
                  user = userSnap.data();
                }

                if (slipSnap && slipSnap.exists()) {
                  const data = slipSnap.data();
                  if (data) {
                    attachedSlip = { id: slipSnap.id, ...data } as SlipDoc;
                  }
                }
              } catch (err) {
                console.error("[FORZA] error loading slip/user for post", post.id, err);
              }

              return { post, attachedSlip, user };
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
    return <LoadingSkeleton />;
  }

  if (!items.length) {
    return (
      <section className="mt-6 space-y-2">
        <h2 className="text-[13px] font-medium text-[#EDEDED]">
          Latest posts (live)
        </h2>
        <p className="text-[12px] text-[#9F9F9F]">
          No posts yet. Share your football takes and attach slips!
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-[13px] font-medium text-[#EDEDED]">
        Latest posts (live)
      </h2>

      {items.map(({ post, attachedSlip, user }) => {
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

        // Handle old slip posts (backward compatibility)
        if (post.type === "slip" && attachedSlip) {
          return (
            <SlipCard
              key={post.id}
              slip={attachedSlip}
              author={author}
              onOpenComments={setSelectedSlipForComments}
            />
          );
        }

        // Handle new text posts
        if (!post.text) return null; // Skip posts without text

        return (
          <article key={post.id} className="rounded-3xl bg-[#050505] border border-[#151515] p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1f262f] flex items-center justify-center text-sm font-semibold overflow-hidden">
                {author.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.photoURL}
                    alt={author.displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span>{author.displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">
                  {author.displayName}
                </span>
                <span className="text-xs text-[#98A2B3]">
                  @{author.username}
                </span>
              </div>
            </div>

            {/* Post text */}
            <p className="text-white text-sm leading-relaxed">
              {post.text}
            </p>

            {/* Attached slip */}
            {attachedSlip && attachedSlip.selections && attachedSlip.selections.length > 0 && (
              <div className="mt-3">
                <SlipCard
                  slip={attachedSlip}
                  author={author}
                  onOpenComments={setSelectedSlipForComments}
                />
              </div>
            )}
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