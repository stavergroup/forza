"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export type SlipBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number | null;
};

type SaveMode = "save" | "track" | "post";

export type SlipActionsProps = {
  bets: SlipBet[];
  bookmaker?: string | null;
  bookingCode?: string | null;
  rawText?: string;
  // image  = screenshot upload
  // import = BetPawa booking code
  // ai     = Ask AI to build slip
  source: "image" | "import" | "ai";
};

export default function SlipActions({
  bets,
  bookmaker = null,
  bookingCode = null,
  rawText = "",
  source,
}: SlipActionsProps) {
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function handleSave(mode: SaveMode) {
    if (!bets || bets.length === 0) {
      setErrorMsg("No valid bets found to save.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("You must be signed in to save or post a slip.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);
      setErrorMsg(null);

      const slipRef = await addDoc(collection(db, "slips"), {
        userId: user.uid,
        bookmaker,
        bookingCode,
        bets: bets.map((b) => ({
          homeTeam: b.homeTeam,
          awayTeam: b.awayTeam,
          market: b.market,
          selection: b.selection,
          odds: b.odds ?? null,
        })),
        source,
        rawText,
        tracking: mode === "track" || mode === "post",
        createdAt: serverTimestamp(),
      });

      if (mode === "post") {
        await addDoc(collection(db, "posts"), {
          userId: user.uid,
          slipId: slipRef.id,
          type: "slip",
          createdAt: serverTimestamp(),
        });
      }

      if (mode === "save") {
        setSaveMessage("Slip saved.");
      } else if (mode === "track") {
        setSaveMessage("Slip saved and marked for tracking.");
      } else if (mode === "post") {
        setSaveMessage("Slip saved and posted to your feed.");
      }
    } catch (err: any) {
      console.error("[FORZA] save/post slip error:", err);
      setErrorMsg("Failed to save/post slip. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!bets || bets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {errorMsg && (
        <p className="text-[11px] text-[#FF6B81]">{errorMsg}</p>
      )}

      <button
        type="button"
        onClick={() => handleSave("post")}
        disabled={saving}
        className="w-full rounded-full bg-[var(--forza-accent)] text-black font-semibold py-2.5 text-[13px] shadow-[0_0_18px_var(--forza-glow)] disabled:opacity-60"
      >
        {saving ? "Working…" : "Post"}
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSave("save")}
          disabled={saving}
          className="flex-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[12px] text-white py-2 disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => handleSave("track")}
          disabled={saving}
          className="flex-1 rounded-full bg-[#1A1A1A] border border-[var(--forza-accent)] text-[12px] text-[var(--forza-accent)] py-2 disabled:opacity-60"
        >
          Track
        </button>
      </div>

      {saveMessage && (
        <p className="text-[11px] text-[#A8A8A8]">
          {saveMessage}
        </p>
      )}
    </div>
  );
}