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
} from "firebase/firestore";

type SlipDoc = {
  id: string;
  matchId: number | string | null;
  homeTeam: string;
  awayTeam: string;
  league: string;
  markets: string[];
  stake: number;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

export default function MySlipsList() {
  const [user, setUser] = useState<User | null>(null);
  const [slips, setSlips] = useState<SlipDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setSlips([]);
      setLoading(false);
      return;
    }

    fetchSlips(user, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchSlips(u: User, isManual: boolean) {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const q = query(
        collection(db, "users", u.uid, "slips"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
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
          createdAt: data.createdAt ?? null,
        };
      });

      setSlips(docs);
    } catch (err) {
      console.error("[FORZA] Failed to fetch slips:", err);
      setError("Could not load your slips.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 mt-2 text-[11px] text-slate-400">
        Sign in to see your saved slips.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 mt-2 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-slate-200">
          My Saved Slips
        </p>
        <button
          onClick={() => user && fetchSlips(user, true)}
          disabled={refreshing}
          className="text-[11px] text-slate-400 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400">Loading slips...</p>
      ) : error ? (
        <p className="text-[11px] text-rose-300">{error}</p>
      ) : slips.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          You haven't saved any slips yet.
        </p>
      ) : (
        <div className="space-y-2">
          {slips.map((slip) => {
            let dateLabel = "Unknown time";
            if (slip.createdAt && typeof slip.createdAt.seconds === "number") {
              const d = new Date(slip.createdAt.seconds * 1000);
              dateLabel = d.toLocaleString();
            }

            return (
              <div
                key={slip.id}
                className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-[11px] space-y-1"
              >
                <div className="flex justify-between items-center">
                  <p className="text-slate-200 font-semibold">
                    {slip.homeTeam} vs {slip.awayTeam}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {slip.league}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{dateLabel}</p>
                <p className="text-[11px] text-slate-300">
                  Stake: <span className="font-semibold">{slip.stake}</span>{" "}
                  Tsh
                </p>
                {slip.markets.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {slip.markets.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}