"use client";

import Header from "@/components/Header";
import LiveFeedSection from "@/components/LiveFeedSection";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/lib/firebaseClient";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AttachSlipSheet from "@/components/AttachSlipSheet";
import type { Slip } from "@/lib/slips";


export default function FeedPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [attachedSlip, setAttachedSlip] = useState<Slip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    if (!user || !text.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
        attachedSlipId: attachedSlip ? attachedSlip.id : null,
        attachedSlipSummary: attachedSlip
          ? {
              totalOdds: attachedSlip.totalOdds,
              totalPicks: attachedSlip.selections.length,
            }
          : null,
      });

      setText("");
      setAttachedSlip(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 space-y-5 text-sm">
        {/* Composer */}
        <section className={`rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3 shadow-[0_18px_40px_rgba(0,0,0,0.55)] transition-transform duration-200 ${sheetOpen ? '' : 'hover:-translate-y-[1px]'}`}>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[11px] text-[var(--forza-accent)] font-semibold">
              FZ
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your football take…"
                className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2.5 text-[12px] text-white placeholder:text-[#888] resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between text-[11px] text-[#888]">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 text-[#888] cursor-not-allowed">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--forza-accent)]" />
                    <span>Attach match</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#888]" />
                    <span>Attach slip</span>
                  </button>
                </div>
                <button
                  onClick={handlePost}
                  disabled={isSubmitting || !text.trim()}
                  className="px-4 py-1.5 rounded-full bg-[var(--forza-accent)] text-black text-[11px] font-semibold hover:brightness-95 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {isSubmitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>

          {attachedSlip && (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-lime-400/40 bg-lime-400/5 px-3 py-2">
              <div className="text-xs text-white/80">
                <div className="font-medium">
                  {(attachedSlip.selections || []).length}-pick ·{" "}
                  {attachedSlip.totalOdds.toFixed(2)}x
                </div>
                <div className="text-[11px] text-white/50">
                  Slip will be attached to this post
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedSlip(null)}
                className="text-[11px] text-white/60 underline"
              >
                Remove
              </button>
            </div>
          )}

          <AttachSlipSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onSelect={(slip) => setAttachedSlip(slip)}
          />
        </section>

        {/* Match highlights row */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#B5B5B5]">Match highlights</span>
            <span className="text-[#888] hover:text-[var(--forza-accent)] transition-colors">
              View all
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {/* LIVE */}
            <div className="flex-shrink-0 w-20">
              <div className="rounded-2xl border border-[var(--forza-accent)] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  LIVE
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Live now
                </p>
              </div>
            </div>
            {/* AI Pick */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#0B0B0B] flex items-center justify-center text-[10px] text-[var(--forza-accent)]">
                  AI
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  AI hot pick
                </p>
              </div>
            </div>
            {/* Trending match */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  ⚽
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Big derby
                </p>
              </div>
            </div>
            {/* Hot slip */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  🎟
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Hot slip
                </p>
              </div>
            </div>
            {/* League */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  🏆
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Premier Lg
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Live feed from Firestore */}
        <LiveFeedSection />
      </div>
    </>
  );
}