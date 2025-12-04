"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { db } from "@/lib/firestoreClient";
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import Link from "next/link";

export type CommunityInitialMatch = {
  id: number | string;
  homeTeam: string;
  awayTeam: string;
  league: string;
};

type CommunityPageClientProps = {
  initialMatches: CommunityInitialMatch[];
};

type SlipOption = {
  id: string;
  stake: number;
  markets: string[];
  matchId: number | string | null;
  homeTeam: string;
  awayTeam: string;
  league: string;
};

type CommunityPost = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  match?: {
    id: number | string;
    homeTeam: string;
    awayTeam: string;
    league: string;
  } | null;
  slip?: {
    stake: number;
    markets: string[];
    matchId?: number | string | null;
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
  } | null;
  likedBy?: string[];
};

type Comment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

type FilterMode = "all" | "mine" | "match" | "slip";

export default function CommunityPageClient({
  initialMatches,
}: CommunityPageClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [content, setContent] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedSlipId, setSelectedSlipId] = useState("");
  const [slips, setSlips] = useState<SlipOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterMode>("all");

  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, Comment[]>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>(
    {}
  );
  const [commentsLoading, setCommentsLoading] = useState<
    Record<string, boolean>
  >({});

  // AUTH
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // LOAD USER SLIPS
  useEffect(() => {
    if (!user) {
      setSlips([]);
      return;
    }
    async function loadSlips() {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users", user!.uid, "slips"),
            orderBy("createdAt", "desc")
          )
        );
        const docs: SlipOption[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            stake: data.stake ?? 0,
            markets: data.markets ?? [],
            matchId: data.matchId ?? null,
            homeTeam: data.homeTeam ?? "",
            awayTeam: data.awayTeam ?? "",
            league: data.league ?? "",
          };
        });
        setSlips(docs);
      } catch (err) {
        console.error("[FORZA] Community: failed to load slips", err);
      }
    }
    loadSlips();
  }, [user]);

  // LIVE POSTS
  useEffect(() => {
    const qPosts = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(qPosts, (snap) => {
      const docs: CommunityPost[] = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userId: data.userId ?? "",
          userName: data.userName ?? "User",
          userEmail: data.userEmail ?? "",
          content: data.content ?? "",
          createdAt: data.createdAt ?? null,
          match: data.match ?? null,
          slip: data.slip ?? null,
          likedBy: data.likedBy ?? [],
        };
      });
      setPosts(docs);
      setPostsLoading(false);
    });
  }, []);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return null;
    return (
      initialMatches.find((m) => String(m.id) === selectedMatchId) || null
    );
  }, [selectedMatchId, initialMatches]);

  const selectedSlip = useMemo(
    () => slips.find((s) => s.id === selectedSlipId),
    [selectedSlipId, slips]
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filter === "mine") {
        if (!user) return false;
        return post.userId === user.uid;
      }
      if (filter === "match") {
        return !!post.match;
      }
      if (filter === "slip") {
        return !!(post.slip && post.slip.markets && post.slip.markets.length);
      }
      return true;
    });
  }, [posts, filter, user]);

  async function createPost() {
    try {
      setCreateError(null);

      if (!user) {
        setCreateError("Sign in from Profile to post.");
        return;
      }
      if (!content.trim()) {
        setCreateError("Write something before posting.");
        return;
      }

      setCreating(true);

      const matchPayload = selectedMatch
        ? {
            id: selectedMatch.id,
            homeTeam: selectedMatch.homeTeam,
            awayTeam: selectedMatch.awayTeam,
            league: selectedMatch.league,
          }
        : null;

      const slipPayload = selectedSlip
        ? {
            stake: selectedSlip.stake,
            markets: selectedSlip.markets,
            matchId: selectedSlip.matchId,
            homeTeam: selectedSlip.homeTeam,
            awayTeam: selectedSlip.awayTeam,
            league: selectedSlip.league,
          }
        : null;

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || "User",
        userEmail: user.email || "",
        content: content.trim(),
        match: matchPayload,
        slip: slipPayload,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      setContent("");
      setSelectedMatchId("");
      setSelectedSlipId("");
    } catch (err) {
      console.error("[FORZA] Failed to create post:", err);
      setCreateError("Failed to post. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    if (!user) return;
    const uid = user.uid;
    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(uid);
    const ref = doc(db, "posts", post.id);
    try {
      if (hasLiked) {
        await updateDoc(ref, {
          likedBy: arrayRemove(uid),
        });
      } else {
        await updateDoc(ref, {
          likedBy: arrayUnion(uid),
        });
      }
    } catch (err) {
      console.error("[FORZA] Failed to toggle like:", err);
    }
  }

  async function loadComments(postId: string) {
    try {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
      const snap = await getDocs(
        query(
          collection(db, "posts", postId, "comments"),
          orderBy("createdAt", "asc")
        )
      );
      const comments: Comment[] = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userId: data.userId ?? "",
          userName: data.userName ?? "User",
          text: data.text ?? "",
          createdAt: data.createdAt ?? null,
        };
      });
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error("[FORZA] Failed to load comments:", err);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function sendComment(postId: string) {
    if (!user) return;
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    try {
      setCommentSending((prev) => ({ ...prev, [postId]: true }));
      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user.uid,
        userName: user.displayName || "User",
        text,
        createdAt: serverTimestamp(),
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      await loadComments(postId);
    } catch (err) {
      console.error("[FORZA] Failed to send comment:", err);
    } finally {
      setCommentSending((prev) => ({ ...prev, [postId]: false }));
    }
  }

  function formatDate(createdAt?: { seconds: number; nanoseconds: number } | null) {
    if (!createdAt || typeof createdAt.seconds !== "number") {
      return "Just now";
    }
    const d = new Date(createdAt.seconds * 1000);
    return d.toLocaleString();
  }

  function getInitials(nameOrEmail: string) {
    if (!nameOrEmail) return "?";
    const parts = nameOrEmail.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-100">Community</h1>
        <p className="text-xs text-slate-400">
          Share your thoughts, slips and matches with other FORZA users.
        </p>
      </header>

      {/* CREATE POST */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
        {user ? (
          <p className="text-[11px] text-slate-400">
            Posting as{" "}
            <span className="font-semibold">
              {user.displayName || user.email}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-amber-300">
            You're not signed in. Sign in from Profile to post.
          </p>
        )}

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 resize-none"
          placeholder="Share your thoughts about today’s games or your slip ideas..."
        />

        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-slate-100"
        >
          <option value="">Attach match (optional)</option>
          {initialMatches.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.homeTeam} vs {m.awayTeam} · {m.league}
            </option>
          ))}
        </select>

        <select
          value={selectedSlipId}
          onChange={(e) => setSelectedSlipId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-slate-100"
        >
          <option value="">Attach slip (optional)</option>
          {slips.map((s) => (
            <option key={s.id} value={s.id}>
              {s.homeTeam && s.awayTeam
                ? `${s.homeTeam} vs ${s.awayTeam}`
                : "Slip"}{" "}
              · Stake {s.stake} · {s.markets.join(", ")}
            </option>
          ))}
        </select>

        {createError && (
          <p className="text-[11px] text-rose-300">{createError}</p>
        )}

        <button
          onClick={createPost}
          disabled={creating}
          className="w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs disabled:opacity-60"
        >
          {creating ? "Posting…" : "Post"}
        </button>
      </section>

      {/* FILTERS */}
      <section className="flex gap-2 text-[11px]">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-full border px-2 py-1 ${
            filter === "all"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }`}
        >
          All posts
        </button>
        <button
          onClick={() => setFilter("mine")}
          className={`flex-1 rounded-full border px-2 py-1 ${
            filter === "mine"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }`}
        >
          My posts
        </button>
        <button
          onClick={() => setFilter("match")}
          className={`flex-1 rounded-full border px-2 py-1 ${
            filter === "match"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }`}
        >
          With match
        </button>
        <button
          onClick={() => setFilter("slip")}
          className={`flex-1 rounded-full border px-2 py-1 ${
            filter === "slip"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }`}
        >
          With slip
        </button>
      </section>

      {/* FEED */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-200">Global feed</h2>
          {postsLoading && (
            <p className="text-[11px] text-slate-500">Loading…</p>
          )}
        </div>

        {filteredPosts.length === 0 && !postsLoading && (
          <p className="text-[11px] text-slate-500">
            No posts yet for this filter.
          </p>
        )}

        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const likes = post.likedBy?.length ?? 0;
            const hasLiked = user ? post.likedBy?.includes(user.uid) : false;
            const comments = commentsByPost[post.id] || [];

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-[11px] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    {getInitials(post.userName || post.userEmail)}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-100 font-semibold">
                      {post.userName || "User"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                  {user && post.userId === user.uid && (
                    <span className="text-[10px] text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>

                <p className="text-slate-200 whitespace-pre-wrap">
                  {post.content}
                </p>

                {post.match && (
                  <Link
                    href={`/matches/${post.match.id}`}
                    className="block rounded-xl border border-slate-700 bg-slate-900/80 p-2"
                  >
                    <p className="text-[10px] text-slate-400">
                      Attached match
                    </p>
                    <p className="text-[11px] text-slate-100">
                      {post.match.homeTeam} vs {post.match.awayTeam}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {post.match.league}
                    </p>
                  </Link>
                )}

                {post.slip && post.slip.markets && post.slip.markets.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
                    <p className="text-[10px] text-emerald-300 mb-1">
                      Attached slip
                    </p>
                    <p className="text-[11px] text-emerald-100">
                      Stake: <span className="font-semibold">{post.slip.stake}</span> Tsh
                    </p>
                    {post.slip.homeTeam && post.slip.awayTeam && (
                      <p className="text-[10px] text-emerald-200">
                        {post.slip.homeTeam} vs {post.slip.awayTeam} ·{" "}
                        {post.slip.league}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.slip.markets.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-900 border border-emerald-500/40 text-[10px] text-emerald-200"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions: likes + comments toggle */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleLike(post)}
                    disabled={!user}
                    className={`text-[11px] flex items-center gap-1 ${
                      hasLiked ? "text-emerald-300" : "text-slate-400"
                    } disabled:opacity-50`}
                  >
                    <span>{hasLiked ? "♥" : "♡"}</span>
                    <span>{likes}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!commentsByPost[post.id]) {
                        await loadComments(post.id);
                      }
                    }}
                    className="text-[11px] text-slate-400"
                  >
                    Comments {comments.length > 0 ? `(${comments.length})` : ""}
                  </button>
                </div>

                {/* Comments list */}
                {commentsLoading[post.id] && (
                  <p className="text-[10px] text-slate-500 mt-1">Loading comments…</p>
                )}
                {comments.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg bg-slate-900/80 border border-slate-800 px-2 py-1"
                      >
                        <p className="text-[10px] text-slate-300 font-semibold">
                          {c.userName}
                        </p>
                        <p className="text-[10px] text-slate-200">
                          {c.text}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                {user && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100"
                    />
                    <button
                      onClick={() => sendComment(post.id)}
                      disabled={commentSending[post.id]}
                      className="text-[11px] px-2 py-1 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}