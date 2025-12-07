"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { ShareNetwork } from "@phosphor-icons/react";

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
  totalOdds?: number | null;
  createdAt?: any;
  source?: string;
};

type UserProfile = {
  displayName?: string;
  handle?: string;
  photoURL?: string | null;
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

export default function SlipPage() {
  const params = useParams();
  const router = useRouter();
  const slipId = params.id as string;

  const [slip, setSlip] = useState<SlipDoc | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slipId) {
      setError("Invalid slip ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const slipSnap = await getDoc(doc(db, "slips", slipId));
        if (!slipSnap.exists()) {
          setError("Slip not found");
          setLoading(false);
          return;
        }

        const slipData = slipSnap.data() as SlipDoc;
        setSlip(slipData);

        const userSnap = await getDoc(doc(db, "users", slipData.userId));
        if (userSnap.exists()) {
          setUser(userSnap.data() as UserProfile);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching slip:", err);
        setError("Failed to load slip");
        setLoading(false);
      }
    };

    fetchData();
  }, [slipId]);

  const handleShare = () => {
    if (typeof window === "undefined" || !slipId) return;

    const url = `${window.location.origin}/slips/${slipId}`;
    const text = "Check this FORZA slip 👀";

    const navAny = navigator as any;

    if (navAny.share) {
      navAny
        .share({
          title: "FORZA slip",
          text,
          url,
        })
        .catch(() => {});
      return;
    }

    if (navAny.clipboard?.writeText) {
      navAny.clipboard
        .writeText(url)
        .then(() => {
          alert("Slip link copied to clipboard");
        })
        .catch(() => {
          alert("Could not copy link");
        });
      return;
    }

    window.prompt("Copy this link:", url);
  };

  const handleCopyBookingCode = () => {
    if (!slip?.bookingCode) return;
    navigator.clipboard?.writeText(slip.bookingCode).then(() => {
      alert("Booking code copied");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center">
        <div className="bg-[#050505] border border-[#151515] rounded-3xl p-6 w-full max-w-md animate-pulse">
          <div className="h-4 bg-[#151515] rounded mb-4"></div>
          <div className="h-6 bg-[#151515] rounded mb-2"></div>
          <div className="h-4 bg-[#151515] rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-[#151515] rounded"></div>
            <div className="h-3 bg-[#151515] rounded"></div>
            <div className="h-3 bg-[#151515] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center px-4">
        <div className="bg-[#050505] border border-[#151515] rounded-3xl p-6 text-center max-w-sm">
          <h1 className="text-[18px] font-semibold mb-2">Slip not found</h1>
          <p className="text-[14px] text-[#888] mb-4">
            This slip may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="bg-[#a4ff2f] text-black px-4 py-2 rounded-xl font-semibold hover:brightness-95"
          >
            Back to FORZA
          </button>
        </div>
      </div>
    );
  }

  const createdAgo = timeAgoFromTimestamp(slip.createdAt);
  const profileDisplayName = user?.displayName || user?.handle || "FORZA user";
  const profileHandle = user?.handle ? `@${user.handle}` : "";
  const avatarInitial = initialsFromName(profileDisplayName);

  const totalOdds = slip.totalOdds && slip.totalOdds > 0
    ? slip.totalOdds
    : slip.bets.reduce((acc, b) => {
        const o = typeof b.odds === "number" && !Number.isNaN(b.odds) ? b.odds : 1;
        return acc * o;
      }, 1);

  return (
    <div className="min-h-screen bg-[#020202] text-white px-4 py-6">
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/feed")}
          className="text-[#a4ff2f] text-[14px] font-medium hover:underline"
        >
          ← Back to FORZA
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={profileDisplayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#101010] flex items-center justify-center text-[14px] font-semibold">
            {avatarInitial}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">{profileDisplayName}</span>
          <div className="flex items-center gap-1 text-[12px] text-[#888]">
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

      {/* Slip Card */}
      <div className="bg-[#050505] border border-[#151515] rounded-3xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-semibold">FORZA Slip</span>
          {slip.bookmaker && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#888]">{slip.bookmaker}</span>
              {slip.bookingCode && (
                <button
                  onClick={handleCopyBookingCode}
                  className="bg-[#151515] text-[11px] px-2 py-1 rounded-lg hover:bg-[#202020]"
                >
                  {slip.bookingCode}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <span className="text-[24px] font-semibold text-[#a4ff2f]">
            {totalOdds.toFixed(2)}x
          </span>
        </div>

        <div className="space-y-3">
          {slip.bets.map((b, idx) => (
            <div
              key={idx}
              className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-2xl p-3"
            >
              <p className="text-white text-[12px]">
                {b.homeTeam} <span className="text-[#777]">vs</span> {b.awayTeam}
              </p>
              <p className="text-[#A8A8A8] text-[12px]">
                {b.market} • {b.selection}
                {typeof b.odds === "number" && !Number.isNaN(b.odds) && (
                  <span className="text-[#a4ff2f]"> @ {b.odds.toFixed(2)}</span>
                )}
              </p>
              {b.kickoffTime && (
                <p className="text-[10px] text-[#7A7A7A] mt-1">
                  {new Date(b.kickoffTime).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/feed?slip=${slipId}`)}
          className="flex-1 bg-[#a4ff2f] text-black py-3 rounded-xl font-semibold hover:brightness-95"
        >
          Open in FORZA app
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-[#151515] py-3 px-4 rounded-xl hover:bg-[#202020]"
        >
          <ShareNetwork className="h-5 w-5" />
          <span className="text-[14px]">Share</span>
        </button>
      </div>
    </div>
  );
}