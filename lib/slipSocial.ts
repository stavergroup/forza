// lib/slipSocial.ts
"use client";

import {
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import type { User } from "firebase/auth";

// Toggle like for a slip for a specific user
export async function toggleSlipLike(slipId: string, user: User) {
  const slipRef = doc(db, "slips", slipId);
  const likeRef = doc(db, "slips", slipId, "likes", user.uid);

  return runTransaction(db, async (tx) => {
    const [slipSnap, likeSnap] = await Promise.all([
      tx.get(slipRef),
      tx.get(likeRef),
    ]);

    const currentLikes = (slipSnap.data()?.likeCount as number | undefined) ?? 0;

    if (likeSnap.exists()) {
      // user already liked → unlike
      tx.delete(likeRef);
      tx.update(slipRef, {
        likeCount: Math.max(currentLikes - 1, 0),
      });
      return { liked: false, likeCount: Math.max(currentLikes - 1, 0) };
    } else {
      // add like doc for this user
      tx.set(likeRef, {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      tx.update(slipRef, {
        likeCount: currentLikes + 1,
      });
      return { liked: true, likeCount: currentLikes + 1 };
    }
  });
}

// Check if the current user has liked this slip
export async function getUserLikedSlip(slipId: string, user: User) {
  const likeRef = doc(db, "slips", slipId, "likes", user.uid);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists();
}

// Subscribe to comment count for one slip
export function subscribeSlipCommentCount(
  slipId: string,
  onChange: (count: number) => void
) {
  const commentsRef = collection(db, "comments");
  const q = query(commentsRef, where("slipId", "==", slipId));
  return onSnapshot(q, (snap) => {
    onChange(snap.size);
  });
}