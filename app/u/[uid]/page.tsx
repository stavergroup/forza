"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Header from "@/components/Header";
import { db } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { followUser, unfollowUser, isFollowingUser } from "@/lib/firestoreSocial";
import CommentsSheet from "@/components/CommentsSheet";
import { SlipSocialBar } from "@/components/SlipSocialBar";
import FollowersListModal from "@/components/FollowersListModal";
import { SlipCard } from "@/components/SlipCard";
import { PaperPlaneTilt } from '@phosphor-icons/react';

type UserProfile = {
  displayName?: string;
  handle?: string;
  photoURL?: string;
  createdAt?: any;
  followersCount?: number;
  followingCount?: number;
};

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
  id?: string;
  userId: string;
  totalOdds?: number | null;
  selections: SlipSelection[];
  source?: "image" | "import" | "ai" | string;
  createdAt?: any;
  likeCount?: number;
  commentsCount?: number;
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

export default function PublicProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  const [slips, setSlips] = useState<SlipDoc[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [selectedSlipForComments, setSelectedSlipForComments] = useState<string | null>(null);

  const viewedUser = { id: uid, displayName: userProfile?.displayName, username: userProfile?.handle };

  // Fetch user profile
  useEffect(() => {
    const userDocRef = doc(db, "users", uid);
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
          setUserNotFound(false);
        } else {
          setUserProfile(null);
          setUserNotFound(true);
        }
        setUserLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setUserNotFound(true);
        setUserLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  // Fetch user's slips
  useEffect(() => {
    if (!uid) return;

    const slipsRef = collection(db, "slips");
    const q = query(
      slipsRef,
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSlips = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SlipDoc[];
        setSlips(fetchedSlips);
        setSlipsLoading(false);
      },
      (error) => {
        console.error("Error fetching user slips:", error);
        setSlips([]);
        setSlipsLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  // Check if current user is following this user
  useEffect(() => {
    if (!currentUser || !uid || currentUser.uid === uid) return;

    isFollowingUser({ followerId: currentUser.uid, followingId: uid }).then(setIsFollowing);
  }, [currentUser, uid]);

  // Subscribe to follow counts
  useEffect(() => {
    if (!uid) return;

    const followsCol = collection(db, "follows");

    // followers of this profile user
    const followersQ = query(
      followsCol,
      where("followingId", "==", uid)
    );

    // who this profile user is following (for followingCount)
    const followingQ = query(
      followsCol,
      where("followerId", "==", uid)
    );

    const unsubFollowers = onSnapshot(followersQ, (snap) => {
      setFollowersCount(snap.size);

      if (currentUser) {
        const already = snap.docs.some(
          (d) => d.data().followerId === currentUser.uid
        );
        setIsFollowing(already);
      }
    });

    const unsubFollowing = onSnapshot(followingQ, (snap) => {
      setFollowingCount(snap.size);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [uid, currentUser?.uid]);

  const handleToggleFollow = async () => {
    if (!currentUser || !uid) return;
    if (currentUser.uid === uid) return; // cannot follow self

    const followId = `${currentUser.uid}_${uid}`;
    const followRef = doc(db, "follows", followId);

    try {
      setFollowLoading(true);
      if (isFollowing) {
        // UNFOLLOW
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        await deleteDoc(followRef);
      } else {
        // FOLLOW
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: uid,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  async function openOrCreateDM() {
    if (!currentUser || !viewedUser) return;
    if (currentUser.uid === viewedUser.id) return;

    const ids = [currentUser.uid, viewedUser.id].sort();
    const threadId = ids.join('_');

    const threadRef = doc(db, 'dmThreads', threadId);
    const snap = await getDoc(threadRef);

    if (!snap.exists()) {
      await setDoc(threadRef, {
        participantIds: ids,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        otherUserNameMap: {
          [currentUser.uid]: viewedUser.displayName ?? viewedUser.username ?? 'FORZA user',
          [viewedUser.id]: currentUser.displayName ?? currentUser.email ?? 'FORZA user',
        },
      });
    }

    router.push(`/chat/dm/${threadId}`);
  }

  if (userLoading) {
    return (
      <>
        <Header />
        <div className="p-4 space-y-4 text-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#1F1F1F]" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-[#1F1F1F] rounded" />
                <div className="h-4 w-24 bg-[#1F1F1F] rounded" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (userNotFound) {
    return (
      <>
        <Header />
        <div className="p-4 space-y-4 text-sm">
          <div className="text-center space-y-4">
            <p className="text-[16px] text-[#E5E5E5] font-semibold">
              User not found
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="px-6 py-2 rounded-full bg-[#111111] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[var(--forza-accent)] hover:border-[var(--forza-accent)] transition"
            >
              Back to feed
            </button>
          </div>
        </div>
      </>
    );
  }

  const displayName = userProfile?.displayName || "FORZA User";
  const handle = userProfile?.handle || "@forza_user";
  const avatarInitial = initialsFromName(displayName);
  const joinedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt.toDate()).toLocaleDateString()
    : "";

  const savedSlipsCount = 0; // Placeholder, as we don't have this field

  return (
    <>
      <Header />
      <div className="p-4 space-y-5 text-sm">
        {/* User Header */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3">
          <div className="flex items-center gap-3">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={displayName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[14px] text-[var(--forza-accent)] font-semibold">
                {avatarInitial}
              </div>
            )}

            <div className="flex-1">
              <p className="text-[16px] text-[#E5E5E5] font-semibold">
                {displayName}
              </p>
              <p className="text-[12px] text-[#888]">{handle}</p>
              {joinedDate && (
                <p className="text-[11px] text-[#555] mt-0.5">
                  Joined FORZA {joinedDate}
                </p>
              )}
            </div>

            {currentUser && currentUser.uid !== uid && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold transition ${
                  isFollowing
                    ? "bg-[#a4ff2f] text-black"
                    : "border border-[#1F1F1F] text-[#B5B5B5] hover:text-[var(--forza-accent)] hover:border-[var(--forza-accent)]"
                }`}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </section>

        {/* Stats Row */}
        <div className="flex items-center gap-8 mt-4 text-sm">
          <button
            className="flex flex-col items-start"
            onClick={() => setShowFollowersModal(true)}
          >
            <span className="font-semibold">{followersCount}</span>
            <span className="text-[#98A2B3] text-xs">Followers</span>
          </button>

          <button
            className="flex flex-col items-start"
            onClick={() => setShowFollowingModal(true)}
          >
            <span className="font-semibold">{followingCount}</span>
            <span className="text-[#98A2B3] text-xs">Following</span>
          </button>

          {/* you can keep your "Saved slips" tile as is */}
          <div className="flex flex-col items-start">
            <span className="font-semibold">{savedSlipsCount}</span>
            <span className="text-[#98A2B3] text-xs">Saved slips</span>
          </div>
        </div>

        {/* Slips Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-[#EDEDED]">Slips</h2>
            <p className="text-[12px] text-[#9F9F9F]">Public slips from this user.</p>
          </div>

          {slipsLoading ? (
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
          ) : slips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[12px] text-[#9F9F9F]">
                No slips from this user yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slips.map((slip) => {
                if (!slip.selections || slip.selections.length === 0) return null;

                const slipId = slip.id || "";
                const createdAgo = timeAgoFromTimestamp(slip.createdAt);

                const profileDisplayName = displayName;
                const profileHandle = handle;
                const avatarPhoto = userProfile?.photoURL;

                const picksCount = slip.selections.length;

                const totalOdds =
                  slip.totalOdds && slip.totalOdds > 0
                    ? slip.totalOdds
                    : slip.selections.reduce((acc, b) => {
                        const o =
                          typeof b.odd === "number" && !Number.isNaN(b.odd)
                            ? b.odd
                            : 1;
                        return acc * o;
                      }, 1);

                const likesCount = slip.likeCount ?? 0;
                const commentsCount = slip.commentsCount ?? 0;

                const author = {
                  id: uid,
                  displayName: profileDisplayName,
                  username: profileHandle.replace('@', ''),
                  photoURL: avatarPhoto,
                };

                return (
                  <SlipCard
                    key={slipId}
                    slip={slip}
                    author={author}
                    createdAgo={createdAgo}
                    onOpenComments={() => setSelectedSlipForComments(slipId)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Comments Sheet */}
        {selectedSlipForComments && (
          <CommentsSheet
            slipId={selectedSlipForComments}
            onClose={() => setSelectedSlipForComments(null)}
          />
        )}

        {/* Followers Modals */}
        {showFollowersModal && (
          <FollowersListModal
            userId={uid}
            type="followers"
            onClose={() => setShowFollowersModal(false)}
          />
        )}

        {showFollowingModal && (
          <FollowersListModal
            userId={uid}
            type="following"
            onClose={() => setShowFollowingModal(false)}
          />
        )}
      </div>
    </>
  );
}