import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  increment,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebaseClient";

/**
 * Toggle like for a slip
 */
export async function toggleSlipLike({
  slipId,
  userId,
  slipCollection = "slips",
}: {
  slipId: string;
  userId: string;
  slipCollection?: string;
}) {
  const likeRef = doc(db, slipCollection, slipId, "likes", userId);
  const slipRef = doc(db, slipCollection, slipId);

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const slipSnap = await tx.get(slipRef);
    if (!slipSnap.exists()) return;

    const currentLikes = slipSnap.data().likeCount || 0;

    if (likeSnap.exists()) {
      // Unlike
      tx.delete(likeRef);
      tx.update(slipRef, { likeCount: Math.max(0, currentLikes - 1) });
    } else {
      tx.set(likeRef, {
        userId,
        createdAt: serverTimestamp(),
      });
      tx.update(slipRef, { likeCount: currentLikes + 1 });
    }
  });
}

/**
 * Check if current user liked this slip
 */
export async function hasLikedSlip({
  slipId,
  userId,
  slipCollection = "slips",
}: {
  slipId: string;
  userId: string;
  slipCollection?: string;
}): Promise<boolean> {
  const likeRef = doc(db, slipCollection, slipId, "likes", userId);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

/**
 * Add a comment to slip
 */
export async function addSlipComment({
  slipId,
  userId,
  text,
  slipCollection = "slips",
}: {
  slipId: string;
  userId: string;
  text: string;
  slipCollection?: string;
}) {
  if (!text.trim()) return;

  const slipRef = doc(db, slipCollection, slipId);
  const commentsRef = collection(db, "comments");

  // Create comment doc
  await addDoc(commentsRef, {
    slipId,
    userId,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}

/**
 * Follow / unfollow a user
 */
export async function toggleFollowUser({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (followerId === followingId) return;

  const relId = `${followerId}_${followingId}`;
  const relRef = doc(db, "userFollows", relId);

  const snap = await getDoc(relRef);
  if (snap.exists()) {
    await deleteDoc(relRef);
  } else {
    await setDoc(relRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
  }
}

export async function isFollowingUser({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}): Promise<boolean> {
  if (followerId === followingId) return false;
  const relId = `${followerId}_${followingId}`;
  const relRef = doc(db, "userFollows", relId);
  const snap = await getDoc(relRef);
  return snap.exists();
}

/**
 * Simple counter helpers (optional)
 */
export async function getFollowerCount(userId: string) {
  const q = query(
    collection(db, "userFollows"),
    where("followingId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function getFollowingCount(userId: string) {
  const q = query(
    collection(db, "userFollows"),
    where("followerId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.size;
}

/**
 * Follow a user
 */
export async function followUser({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (followerId === followingId) return;

  const relId = `${followerId}_${followingId}`;
  const relRef = doc(db, "userFollows", relId);

  await setDoc(relRef, {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Unfollow a user
 */
export async function unfollowUser({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (followerId === followingId) return;

  const relId = `${followerId}_${followingId}`;
  const relRef = doc(db, "userFollows", relId);

  await deleteDoc(relRef);
}