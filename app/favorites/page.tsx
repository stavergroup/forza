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
import { SlipCard } from "@/components/SlipCard";

type SlipSelection = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  pick: string;
  odd?: number | null;
  kickoffTime?: string | null;
  league?: string | null;
};

type Slip = {
  id: string;
  userId: string;
  totalOdds?: number | null;
  selections: SlipSelection[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
  likeCount?: number;
  commentsCount?: number;
  userDisplayName?: string;
  userUsername?: string;
  userPhotoURL?: string | null;
};

type SavedSlip = {
  id: string;
  slip: Slip;
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
  const [savedSlips, setSavedSlips] = useState<SavedSlip[]>([]);
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
        const rows: SavedSlip[] = [];

        for (const savedDoc of snapshot.docs) {
          const savedData = savedDoc.data() as { slipId: string };
          const slipRef = doc(db, "slips", savedData.slipId);
          const slipSnap = await getDoc(slipRef);
          if (!slipSnap.exists()) continue;

          rows.push({
            id: savedDoc.id,
            slip: { id: slipSnap.id, ...(slipSnap.data() as Omit<Slip, 'id'>) },
          });
        }

        setSavedSlips(rows);
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
        {!loading && savedSlips.length === 0 && (
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
        {!loading && savedSlips.length > 0 && (
          <div className="space-y-3">
            {savedSlips.map(({ id, slip }) => {
              if (!slip.selections || slip.selections.length === 0) return null;

              const author = {
                id: slip.userId,
                displayName: slip.userDisplayName || "FORZA user",
                username: slip.userUsername || "forzauser",
                photoURL: slip.userPhotoURL || null,
              };

              return (
                <SlipCard
                  key={id}
                  slip={slip}
                  author={author}
                  onOpenComments={setSelectedSlipForComments}
                />
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