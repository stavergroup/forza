"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

type ParsedBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number | null;
};

type ParsedSlip = {
  isBetSlip?: boolean;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets?: ParsedBet[];
  rawText?: string;
};

export default function SlipUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedSlip | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function analyzeFile(file: File) {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/slips/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to read slip.");
      }

      const data: ParsedSlip = await res.json();
      setResult(data);

      if (data.isBetSlip === false) {
        setErrorMsg("This is not a screenshot of a football betslip.");
      }
    } catch (err: any) {
      console.error("[FORZA] slip upload error:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setResult(null);
      setErrorMsg(null);
      setSaveMessage(null);
      return;
    }

    setFileName(file.name);
    setResult(null);
    setErrorMsg(null);
    setSaveMessage(null);

    // Auto-analyze as soon as user picks the file
    void analyzeFile(file);
  }

  async function handleSaveSlip() {
    if (!result) return;

    const bets = result.bets ?? [];
    const isBetSlip = result.isBetSlip ?? (bets.length > 0);

    if (!isBetSlip || bets.length === 0) {
      setErrorMsg("No valid bets found to save.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("You must be signed in to save a slip.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);
      setErrorMsg(null);

      await addDoc(collection(db, "slips"), {
        userId: user.uid,
        bookmaker: result.bookmaker ?? null,
        bookingCode: result.bookingCode ?? null,
        bets: bets.map((b) => ({
          homeTeam: b.homeTeam,
          awayTeam: b.awayTeam,
          market: b.market,
          selection: b.selection,
          odds: b.odds ?? null,
        })),
        source: "image",
        rawText: result.rawText ?? "",
        createdAt: serverTimestamp(),
      });

      setSaveMessage("Slip saved. You can follow it from your slips/profile.");
    } catch (err: any) {
      console.error("[FORZA] save slip error:", err);
      setErrorMsg("Failed to save slip. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const bets = result?.bets ?? [];
  const isBetSlip = result?.isBetSlip ?? (bets.length > 0);

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <label className="block w-full rounded-2xl border border-dashed border-[#3A3A3A] bg-[#111111] px-4 py-5 text-center text-xs text-[#A8A8A8] active:border-[var(--forza-accent)]">
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-[#1C1C1C] flex items-center justify-center text-lg">
            📷
          </div>
          <div>
            <p className="text-[12px] text-white">
              Tap to upload slip screenshot
            </p>
            <p className="text-[11px] text-[#7A7A7A]">
              FORZA will auto-analyze a football betslip.
            </p>
          </div>
          {fileName && (
            <p className="text-[10px] text-[#9F9F9F] mt-1">
              Selected: {fileName}
            </p>
          )}
          {loading && (
            <p className="text-[10px] text-[var(--forza-accent)] mt-1">
              Reading slip…
            </p>
          )}
        </div>
      </label>

      {errorMsg && (
        <p className="text-[11px] text-[#FF6B81]">{errorMsg}</p>
      )}

      {/* Detected bets */}
      {isBetSlip && bets.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-white">
              Detected bets
            </p>
            {bets.map((bet, index) => (
              <div
                key={index}
                className="rounded-xl bg-[#111111] border border-[#2A2A2A] px-3 py-2 text-[11px]"
              >
                <p className="text-white">
                  {bet.homeTeam}{" "}
                  <span className="text-[#777]">vs</span>{" "}
                  {bet.awayTeam}
                </p>
                <p className="text-[#A8A8A8]">
                  {bet.market} • {bet.selection}
                  {bet.odds != null && (
                    <span className="text-[var(--forza-accent)]">
                      {" "}
                      • @ {bet.odds}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Save slip button */}
          <button
            type="button"
            onClick={handleSaveSlip}
            disabled={saving}
            className="w-full rounded-full bg-[var(--forza-accent)] text-black font-semibold py-2.5 text-[13px] shadow-[0_0_18px_var(--forza-glow)] disabled:opacity-60"
          >
            {saving ? "Saving slip…" : "Save slip & track"}
          </button>

          {saveMessage && (
            <p className="text-[11px] text-[#A8A8A8]">
              {saveMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}