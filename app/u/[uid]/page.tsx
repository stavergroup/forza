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
} from "firebase/firestore";
import { followUser, unfollowUser, isFollowingUser } from "@/lib/firestoreSocial";
import CommentsSheet from "@/components/CommentsSheet";
import { SlipSocialBar } from "@/components/SlipSocialBar";
import FollowersListModal from "@/components/FollowersListModal";

type UserProfile = {
  displayName?: string;
  handle?: string;
  photoURL?: string;
  createdAt?: any;
  followersCount?: number;
  followingCount?: number;
};

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
                if (!slip.bets || slip.bets.length === 0) return null;

                const slipId = slip.id || "";
                const createdAgo = timeAgoFromTimestamp(slip.createdAt);

                const profileDisplayName = displayName;
                const profileHandle = handle;
                const avatarPhoto = userProfile?.photoURL;

                const picksCount = slip.bets.length;

                const totalOdds =
                  slip.totalOdds && slip.totalOdds > 0
                    ? slip.totalOdds
                    : slip.bets.reduce((acc, b) => {
                        const o =
                          typeof b.odds === "number" && !Number.isNaN(b.odds)
                            ? b.odds
                            : 1;
                        return acc * o;
                      }, 1);

                const likesCount = slip.likeCount ?? 0;
                const commentsCount = slip.commentsCount ?? 0;

                return (
                  <article
                    key={slipId}
                    className="rounded-3xl bg-[#050505] border border-[#151515] p-3.5 space-y-3"
                  >
                    {/* Top row: avatar + name + time */}
                    <div className="flex items-center gap-3">
                      {avatarPhoto ? (
                        <img
                          src={avatarPhoto}
                          alt={profileDisplayName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#101010] flex items-center justify-center text-[11px] font-semibold text-white">
                          {avatarInitial}
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-white">
                          {profileDisplayName}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                          <span>{profileHandle}</span>
                          <span>•</span>
                          <span>{createdAgo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Slip preview */}
                    <div className="rounded-3xl bg-[#050505] border border-[var(--forza-accent-soft,#27361a)] px-3.5 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#E4E4E4]">
                          Slip preview
                        </span>
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
                              {b.homeTeam}{" "}
                              <span className="text-[#777]">vs</span>{" "}
                              {b.awayTeam}
                            </p>
                            <p className="text-[#A8A8A8]">
                              {b.market} • {b.selection}
                              {typeof b.odds === "number" &&
                                !Number.isNaN(b.odds) && (
                                  <span className="text-[var(--forza-accent)]">
                                    {" "}
                                    @ {b.odds.toFixed(2)}
                                  </span>
                                )}
                            </p>
                            {b.kickoffTime && (
                              <p className="text-[10px] text-[#7A7A7A] mt-[2px]">
                                Kickoff:{" "}
                                {new Date(
                                  b.kickoffTime
                                ).toLocaleString(undefined, {
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

                    <SlipSocialBar
                      slipId={slipId}
                      initialLikeCount={likesCount}
                      initialCommentCount={commentsCount}
                      onOpenComments={() => setSelectedSlipForComments(slipId)}
                    />

                  </article>
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