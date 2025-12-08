// lib/slips.ts
"use client";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebaseClient";

export type SlipSelection = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  pick: string;
  odd: number;
  kickoffTime: string;
};

export type Slip = {
  id: string;
  userId: string;
  totalOdds: number;
  selections: SlipSelection[];
  createdAt?: any;
};

export async function getUserSlips(userId: string): Promise<Slip[]> {
  const q = query(
    collection(db, "slips"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();

    // Backward compatibility: convert old bets to new selections
    let selections = data.selections;
    if (!selections && data.bets) {
      selections = data.bets.map((bet: any) => ({
        homeTeam: bet.homeTeam,
        awayTeam: bet.awayTeam,
        market: bet.market,
        pick: bet.selection || bet.pick,
        odd: bet.odds || bet.odd,
        kickoffTime: bet.kickoffTime,
      }));
    }

    return {
      id: doc.id,
      userId: data.userId,
      totalOdds: data.totalOdds || 1,
      selections: selections || [],
      createdAt: data.createdAt,
    } as Slip;
  });
}