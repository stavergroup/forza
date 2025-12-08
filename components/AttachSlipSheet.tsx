"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/lib/firebaseClient";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Slip } from "@/lib/slips";

type ParsedSlip = {
  isBetSlip?: boolean;
  bookmaker?: string | null;
  bookingCode?: string | null;
  bets?: any[];
  rawText?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (slip: Slip) => void;
};

export default function AttachSlipSheet({ open, onClose, onSelect }: Props) {
  const { user } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedSlip | null>(null);
  const [saving, setSaving] = useState(false);

  async function analyzeFile(file: File) {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

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
      return;
    }

    setFileName(file.name);
    setResult(null);
    setErrorMsg(null);

    // Auto-analyze
    void analyzeFile(file);
  }

  async function handleAttachSlip() {
    if (!user || !result?.bets || result.bets.length === 0) return;

    setSaving(true);
    try {
      const totalOdds = result.bets.reduce((acc: number, bet: any) => {
        const odd = bet.odd || bet.odds || 1;
        return acc * (typeof odd === 'number' && !isNaN(odd) ? odd : 1);
      }, 1);

      const selections = result.bets
        .filter((bet: any) => bet.homeTeam && bet.awayTeam && bet.market && (bet.pick || bet.selection))
        .map((bet: any) => ({
          homeTeam: bet.homeTeam,
          awayTeam: bet.awayTeam,
          market: bet.market,
          pick: bet.pick || bet.selection,
          odd: bet.odd || bet.odds || 1,
          kickoffTime: bet.kickoffTime,
        }));

      if (selections.length === 0) {
        setErrorMsg("No valid bets found in the slip.");
        return;
      }

      const validTotalOdds = typeof totalOdds === 'number' && !isNaN(totalOdds) ? totalOdds : 1;

      const slipData: any = {
        userId: user.uid,
        totalOdds: validTotalOdds,
        selections,
        source: "image",
        createdAt: serverTimestamp(),
        userDisplayName: user.displayName || "FORZA user",
        userUsername: "",
        userPhotoURL: user.photoURL || null,
      };

      // Only add optional fields if they exist
      if (result.bookmaker) slipData.bookmaker = result.bookmaker;
      if (result.bookingCode) slipData.bookingCode = result.bookingCode;
      if (result.rawText) slipData.rawText = result.rawText;

      const slipRef = await addDoc(collection(db, "slips"), slipData);

      const attachedSlip: Slip = {
        id: slipRef.id,
        userId: user.uid,
        totalOdds,
        selections,
        createdAt: serverTimestamp(),
      };

      onSelect(attachedSlip);
      onClose();
    } catch (err: any) {
      console.error("[FORZA] attach slip error:", err);
      setErrorMsg("Failed to attach slip. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setFileName(null);
    setLoading(false);
    setErrorMsg(null);
    setResult(null);
    setSaving(false);
  }

  if (!open) return null;

  const bets = result?.bets ?? [];
  const isBetSlip = result?.isBetSlip ?? (bets.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#050505] p-4 border border-white/10 max-h-[80vh] overflow-y-auto">
        <div className="mb-3 text-center text-sm font-medium text-white/80">
          Attach a slip
        </div>

        {/* Upload area */}
        <label className="block w-full rounded-2xl border border-dashed border-[#3A3A3A] bg-[#111111] px-4 py-5 text-center text-xs text-[#A8A8A8] active:border-[var(--forza-accent)] mb-3">
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
                FORZA will auto-analyze and attach it
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
          <p className="text-[11px] text-[#FF6B81] mb-3">{errorMsg}</p>
        )}

        {/* Detected bets */}
        {isBetSlip && bets.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-white">
                Detected bets ({bets.length})
              </p>
              {bets.slice(0, 3).map((bet: any, index: number) => (
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
                    {bet.market} • {bet.pick || bet.selection}
                    {(bet.odd || bet.odds) && (
                      <span className="text-[var(--forza-accent)]">
                        {" "}
                        @ {bet.odd || bet.odds}
                      </span>
                    )}
                  </p>
                </div>
              ))}
              {bets.length > 3 && (
                <p className="text-[10px] text-[#7A7A7A]">
                  +{bets.length - 3} more bets...
                </p>
              )}
            </div>

            <button
              onClick={handleAttachSlip}
              disabled={saving}
              className="w-full rounded-full bg-[var(--forza-accent)] text-black font-semibold py-2.5 text-[13px] disabled:opacity-60"
            >
              {saving ? "Attaching…" : "Attach this slip"}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="flex-1 rounded-2xl border border-white/10 py-2 text-sm text-white/70"
          >
            Cancel
          </button>
          {fileName && (
            <button
              onClick={reset}
              className="flex-1 rounded-2xl border border-white/10 py-2 text-sm text-white/70"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}