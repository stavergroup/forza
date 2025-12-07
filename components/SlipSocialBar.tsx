// components/SlipSocialBar.tsx  (or inside your SlipCard)
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebaseClient";
import {
  toggleSlipLike,
  getUserLikedSlip,
  subscribeSlipCommentCount,
} from "@/lib/slipSocial";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Heart,
  ChatCircle,
  ShareNetwork,
  Star,
} from "@phosphor-icons/react"; // phosphor icon import

type SlipSocialBarProps = {
  slipId: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  onOpenComments: () => void;
};

export function SlipSocialBar({
  slipId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  onOpenComments,
}: SlipSocialBarProps) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Load whether THIS user has liked this slip
  useEffect(() => {
    if (!user) return;
    getUserLikedSlip(slipId, user).then(setHasLiked).catch(() => {});
  }, [user, slipId]);

  // Keep like count live from Firestore (in case other users like)
  useEffect(() => {
    const slipRef = doc(db, "slips", slipId);
    const unsub = onSnapshot(slipRef, (snap) => {
      const data = snap.data();
      if (data?.likeCount !== undefined) {
        setLikeCount(data.likeCount);
      }
    });
    return unsub;
  }, [slipId]);

  // Keep comment count per slip
  useEffect(() => {
    const unsub = subscribeSlipCommentCount(slipId, (count) =>
      setCommentCount(count)
    );
    return unsub;
  }, [slipId]);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);

    const nextLiked = !hasLiked;
    // optimistic UI
    setHasLiked(nextLiked);
    setLikeCount((prev) => prev + (nextLiked ? 1 : -1));

    try {
      const result = await toggleSlipLike(slipId, user);
      setHasLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (e) {
      // rollback on error
      setHasLiked((prev) => !prev);
      setLikeCount((prev) => prev + (nextLiked ? -1 : 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (typeof window === "undefined" || !slipId) return;

    const url = `${window.location.origin}/feed?slip=${slipId}`;
    const text = "Check this FORZA slip 👀";

    const navAny = navigator as any;

    // ✅ Native share (mobile)
    if (navAny.share) {
      navAny
        .share({
          title: "FORZA slip",
          text,
          url,
        })
        .catch(() => {
          // user canceled – do nothing
        });
      return;
    }

    // ✅ Fallback: copy link
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

    // Super old browsers: just show prompt
    window.prompt("Copy this link:", url);
  };

  return (
    <div className="mt-3 flex items-center justify-between px-2 text-xs text-zinc-400">
      {/* LIKE */}
      <button
        onClick={handleLike}
        className="flex items-center gap-1"
        disabled={isLiking}
      >
        <Heart
          weight={hasLiked ? "fill" : "regular"}
          className={hasLiked ? "h-4 w-4 text-lime-300" : "h-4 w-4"}
        />
        <span>{likeCount}</span>
      </button>

      {/* COMMENT */}
      <button
        onClick={onOpenComments}
        className="flex items-center gap-1"
      >
        <ChatCircle className="h-4 w-4" />
        <span>{commentCount}</span>
      </button>

      {/* SHARE – just icon + count placeholder (0 for now) */}
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1"
      >
        <ShareNetwork className="h-4 w-4" />
        <span className="text-[11px] text-slate-400">0</span>
      </button>

      {/* FOLLOW – star icon, no count */}
      <button className="flex items-center gap-1">
        <Star className="h-4 w-4" />
      </button>
    </div>
  );
}