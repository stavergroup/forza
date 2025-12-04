"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firestoreClient";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";

type PostDoc = {
  id: string;
  userName: string;
  userEmail: string | null;
  content: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  match: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    time?: string;
    status?: string;
  } | null;
  slip: {
    id: string;
    matchId: number | string | null;
    homeTeam: string;
    awayTeam: string;
    league: string;
    stake: number;
    markets: string[];
  } | null;
};

export default function CommunityFeedClient() {
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPosts(isManual: boolean) {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const qPosts = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(qPosts);
      const docs: PostDoc[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userName: data.userName ?? "Unknown",
          userEmail: data.userEmail ?? null,
          content: data.content ?? "",
          createdAt: data.createdAt ?? null,
          match: data.match ?? null,
          slip: data.slip ?? null,
        };
      });

      setPosts(docs);
    } catch (err) {
      console.error("[FORZA] Failed to fetch posts:", err);
      setError("Failed to load community posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPosts(false);
  }, []);

  function formatDate(ts?: { seconds: number; nanoseconds: number } | null) {
    if (!ts || typeof ts.seconds !== "number") return "Unknown time";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString();
  }

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            Community
          </h1>
          <p className="text-xs text-slate-400">
            See what other bettors are thinking and sharing.
          </p>
        </div>
        <Link
          href="/community/new"
          className="rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-semibold px-3 py-2"
        >
          New post
        </Link>
      </header>

      <div className="flex justify-between items-center text-[11px]">
        <button
          onClick={() => fetchPosts(true)}
          disabled={refreshing}
          className="text-slate-400 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
        <p className="text-slate-500">
          {posts.length} post{posts.length === 1 ? "" : "s"}
        </p>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400">Loading community...</p>
      ) : error ? (
        <p className="text-[11px] text-rose-300">{error}</p>
      ) : posts.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          No posts yet. Be the first to post!
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 space-y-2 text-[11px]"
            >
              {/* header: avatar + name + time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    {p.userName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-slate-100 font-semibold">
                      {p.userName}
                    </p>
                    {p.userEmail && (
                      <p className="text-[10px] text-slate-500">
                        {p.userEmail}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  {formatDate(p.createdAt)}
                </p>
              </div>

              {/* content */}
              <p className="text-slate-100 whitespace-pre-wrap">
                {p.content}
              </p>

              {/* attached match */}
              {p.match && (
                <Link
                  href={`/matches/${p.match.id}`}
                  className="mt-1 block rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[11px] text-slate-300">
                        {p.match.homeTeam} vs {p.match.awayTeam}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {p.match.league}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      {p.match.time && <p>{p.match.time}</p>}
                      {p.match.status && <p>{p.match.status}</p>}
                    </div>
                  </div>
                </Link>
              )}

              {/* attached slip */}
              {p.slip && (
                <div className="mt-1 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-2 py-2 space-y-1">
                  <p className="text-[11px] text-emerald-200 font-semibold">
                    Attached slip
                  </p>
                  <p className="text-[11px] text-emerald-100">
                    {p.slip.homeTeam} vs {p.slip.awayTeam} · {p.slip.league}
                  </p>
                  <p className="text-[11px] text-emerald-200">
                    Stake: <span className="font-semibold">{p.slip.stake}</span> Tsh
                  </p>
                  {p.slip.markets && p.slip.markets.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.slip.markets.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-[10px] text-emerald-100"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}