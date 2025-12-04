"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { db } from "@/lib/firestoreClient";
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

type SlipDoc = {
  id: string;
  matchId: number | string | null;
  homeTeam: string;
  awayTeam: string;
  league: string;
  markets: string[];
  stake: number;
};

type FixtureOption = {
  id: number;
  league: string;
  leagueShort?: string;
  time: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
};

export default function CommunityCreateClient() {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const [fixtures, setFixtures] = useState<FixtureOption[]>([]);
  const [slips, setSlips] = useState<SlipDoc[]>([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(
    null
  );
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadData(u: User | null) {
      try {
        setLoading(true);
        setError(null);

        // Load fixtures for today
        const fixturesRes = await fetch("/api/community/today-fixtures");
        const fixturesJson = await fixturesRes.json();
        setFixtures(fixturesJson.fixtures ?? []);

        // Load user's saved slips
        if (u) {
          const qSlips = query(
            collection(db, "users", u.uid, "slips"),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(qSlips);
          const docs: SlipDoc[] = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            return {
              id: doc.id,
              matchId: data.matchId ?? null,
              homeTeam: data.homeTeam ?? "",
              awayTeam: data.awayTeam ?? "",
              league: data.league ?? "",
              markets: data.markets ?? [],
              stake: data.stake ?? 0,
            };
          });
          setSlips(docs);
        } else {
          setSlips([]);
        }
      } catch (err) {
        console.error("[FORZA] CommunityCreate load error:", err);
        setError("Failed to load matches or slips.");
      } finally {
        setLoading(false);
      }
    }

    loadData(user);
  }, [user]);

  async function handlePost() {
    try {
      setError(null);
      setSuccess(null);

      if (!user) {
        setError("You must be signed in to post. Go to Profile tab to sign in.");
        return;
      }

      if (!content.trim()) {
        setError("Write something before posting.");
        return;
      }

      setPosting(true);

      const fixture =
        selectedFixtureId != null
          ? fixtures.find((f) => f.id === selectedFixtureId)
          : undefined;

      const slip =
        selectedSlipId != null
          ? slips.find((s) => s.id === selectedSlipId)
          : undefined;

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || null,
        content: content.trim(),
        createdAt: serverTimestamp(),
        match: fixture
          ? {
              id: fixture.id,
              homeTeam: fixture.homeTeam,
              awayTeam: fixture.awayTeam,
              league: fixture.league,
              time: fixture.time,
              status: fixture.status,
            }
          : null,
        slip: slip
          ? {
              id: slip.id,
              matchId: slip.matchId,
              homeTeam: slip.homeTeam,
              awayTeam: slip.awayTeam,
              league: slip.league,
              stake: slip.stake,
              markets: slip.markets,
            }
          : null,
      });

      setSuccess("Posted to FORZA community ✅");
      setContent("");
      setSelectedFixtureId(null);
      setSelectedSlipId(null);
    } catch (err) {
      console.error("[FORZA] Failed to create post:", err);
      setError("Failed to publish your post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">
          New community post
        </h1>
        <p className="text-xs text-slate-400">
          Share your thoughts, attach today's match and/or one of your slips.
        </p>
      </header>

      {user ? (
        <p className="text-[11px] text-slate-400">
          Posting as <span className="font-semibold">{user.displayName || user.email}</span>
        </p>
      ) : (
        <p className="text-[11px] text-rose-300">
          You are not signed in. Go to Profile tab and sign in to post.
        </p>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100"
            placeholder="What are you thinking about today's matches or your slips?"
          />
        </div>

        {/* Attach match */}
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-slate-300">Attach match (optional)</p>
          {loading ? (
            <p className="text-[11px] text-slate-500">Loading today's fixtures...</p>
          ) : fixtures.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No fixtures found for today.
            </p>
          ) : (
            <select
              value={selectedFixtureId ?? ""}
              onChange={(e) =>
                setSelectedFixtureId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-[11px] text-slate-100"
            >
              <option value="">No match attached</option>
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.homeTeam} vs {f.awayTeam} · {f.league} · {f.time}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Attach slip */}
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-slate-300">Attach one of your slips (optional)</p>
          {!user ? (
            <p className="text-[11px] text-slate-500">
              Sign in to attach a saved slip.
            </p>
          ) : loading ? (
            <p className="text-[11px] text-slate-500">Loading your slips...</p>
          ) : slips.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              You haven't saved any slips yet.
            </p>
          ) : (
            <select
              value={selectedSlipId ?? ""}
              onChange={(e) =>
                setSelectedSlipId(e.target.value || null)
              }
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-[11px] text-slate-100"
            >
              <option value="">No slip attached</option>
              {slips.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.homeTeam} vs {s.awayTeam} · {s.league} · Stake {s.stake}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handlePost}
          disabled={posting || !user}
          className="mt-3 w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {posting ? "Posting..." : "Post to community"}
        </button>

        {error && (
          <p className="text-[11px] text-rose-300 mt-1">{error}</p>
        )}
        {success && (
          <p className="text-[11px] text-emerald-300 mt-1">{success}</p>
        )}
      </section>
    </main>
  );
}