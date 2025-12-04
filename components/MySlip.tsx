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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export type SlipItem = {
  id: string;
  label: string;
};

type MySlipProps = {
  matchId?: number | string;
  homeTeam: string;
  awayTeam: string;
  league: string;
};

export default function MySlip({ matchId, homeTeam, awayTeam, league }: MySlipProps) {
  const [items, setItems] = useState<SlipItem[]>([]);
  const [stake, setStake] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  function addItem(label: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev, { id, label }]);
    setSaveMessage(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSaveMessage(null);
  }

  function clearSlip() {
    setItems([]);
    setStake("");
    setSaveMessage(null);
  }

  const potentialReturn =
    stake && items.length > 0 ? `~${Number(stake) * (1.5 + items.length / 3)}x` : "--";

  async function handleSaveSlip() {
    try {
      setSaveMessage(null);

      if (!user) {
        setSaveMessage("Sign in from Profile tab to save slips.");
        return;
      }

      if (!items.length) {
        setSaveMessage("Add at least one market to your slip.");
        return;
      }

      if (!stake || Number(stake) <= 0) {
        setSaveMessage("Enter a valid stake amount.");
        return;
      }

      setSaving(true);

      const markets = items.map((i) => i.label);

      await addDoc(collection(db, "users", user.uid, "slips"), {
        matchId: matchId ?? null,
        homeTeam,
        awayTeam,
        league,
        markets,
        stake: Number(stake),
        createdAt: serverTimestamp(),
      });

      setSaveMessage("Slip saved to your FORZA account ✅");
    } catch (error) {
      console.error("[FORZA] Failed to save slip:", error);
      setSaveMessage("Failed to save slip. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 mt-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-slate-200">My Slip</p>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="text-[11px] text-slate-400"
        >
          {showPanel ? "Hide" : "Show"}
        </button>
      </div>

      {!showPanel && <p className="text-[11px] text-slate-400">Slip is hidden</p>}

      {showPanel && (
        <>
          {/* Market buttons */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => addItem("Home Win")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              Home Win
            </button>
            <button
              onClick={() => addItem("Draw")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              Draw
            </button>
            <button
              onClick={() => addItem("Away Win")}
              className="rounded-2xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              Away Win
            </button>

            <button
              onClick={() => addItem("Over 2.5")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              Over 2.5
            </button>
            <button
              onClick={() => addItem("Under 2.5")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              Under 2.5
            </button>
            <button
              onClick={() => addItem("BTTS: Yes")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2"
            >
              BTTS: Yes
            </button>
          </div>

          {/* Selected items */}
          {items.length > 0 ? (
            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-slate-300">Selected markets:</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center text-[11px] bg-slate-800/70 border border-slate-700 rounded-lg px-2 py-1"
                  >
                    <span>{item.label}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-rose-300 text-xs"
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-2">
              No markets selected yet.
            </p>
          )}

          {/* Stake input */}
          <div className="mt-3">
            <p className="text-[11px] text-slate-300 mb-1">Stake (Tsh)</p>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100"
              placeholder="Enter stake amount"
            />
          </div>

          {/* Potential return */}
          <div className="mt-2 text-[11px] text-emerald-300">
            Potential Return: {potentialReturn}
          </div>

          {/* Save + Clear buttons */}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleSaveSlip}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving slip..." : user ? "Save slip to my account" : "Sign in to save slip"}
            </button>
            {(items.length > 0 || stake) && (
              <button
                onClick={clearSlip}
                className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs py-2"
              >
                Clear Slip
              </button>
            )}
          </div>

          {saveMessage && (
            <p className="mt-2 text-[11px] text-slate-300">
              {saveMessage}
            </p>
          )}
        </>
      )}
    </section>
  );
}