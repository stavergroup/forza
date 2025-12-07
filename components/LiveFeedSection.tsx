"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseClient";
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
  odds: number | null;
};

type SlipDoc = {
  userId: string;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets: SlipBet[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
};

type PostDoc = {
  id: string;
  userId: string;
  slipId: string;
  createdAt?: any;
};

type FeedItem = {
  post: PostDoc;
  slip: SlipDoc | null;
};

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
        const basePosts: PostDoc[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            userId: data.userId,
            slipId: data.slipId,
            createdAt: data.createdAt,
          };
        });

        const results: FeedItem[] = [];
        for (const post of basePosts) {
          // Skip if slipId is missing or invalid
          if (!post.slipId || typeof post.slipId !== "string") {
            continue;
          }

          try {
            const slipRef = doc(db, "slips", post.slipId);
            const slipSnap = await getDoc(slipRef);
            const slipData = slipSnap.exists()
              ? (slipSnap.data() as SlipDoc)
              : null;
            results.push({ post, slip: slipData });
          } catch (err) {
            console.warn("[FORZA] error loading slip for post", post.id);
            results.push({ post, slip: null });
          }
        }

        setItems(results);
        setLoading(false);
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
      <section className="mt-4 space-y-2">
        <p className="text-[12px] text-[#9F9F9F]">
          Loading latest slips…
        </p>
      </section>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <section className="mt-4 space-y-2">
        <p className="text-[12px] text-[#9F9F9F]">
          No community slips posted yet. Post from the Build Slip page.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-3">
      <h2 className="text-[13px] font-medium text-[#EDEDED]">
        Latest slips (live)
      </h2>

      {items.map(({ post, slip }) => {
        if (!slip || !slip.bets || slip.bets.length === 0) return null;

        const isMine =
          currentUser && slip.userId === currentUser.uid;

        return (
          <article
            key={post.id}
            className="rounded-2xl bg-[#050505] border border-[#151515] p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[12px] text-white font-medium">
                  {isMine ? "You" : "FORZA user"}
                </span>
                <span className="text-[10px] text-[#8A8A8A]">
                  {slip.source === "ai"
                    ? "FORZA AI slip"
                    : slip.source === "import"
                    ? "Imported slip"
                    : slip.source === "image"
                    ? "Uploaded betslip"
                    : "Slip"}
                  {slip.bookmaker && ` • ${slip.bookmaker}`}
                  {slip.bookingCode && ` • Code ${slip.bookingCode}`}
                </span>
              </div>
              <span className="rounded-full border border-[var(--forza-accent)] px-2 py-[2px] text-[9px] text-[var(--forza-accent)]">
                Live
              </span>
            </div>

            <div className="space-y-1 mt-1">
              {slip.bets.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[11px]"
                >
                  <p className="text-white">
                    {b.homeTeam} <span className="text-[#777]">vs</span>{" "}
                    {b.awayTeam}
                  </p>
                  <p className="text-[#A8A8A8]">
                    {b.market} • {b.selection}
                    {b.odds != null && (
                      <span className="text-[var(--forza-accent)]">
                        {" "}
                        • @ {b.odds}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}