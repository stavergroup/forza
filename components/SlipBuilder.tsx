"use client";

import { useState } from "react";
import type { SlipAiContext } from "@/lib/aiSlip";

type SlipBuilderProps = {
  context: SlipAiContext;
};

export default function SlipBuilder({ context }: SlipBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAskAi() {
    try {
      setLoading(true);
      setError(null);
      setSuggestions(null);

      const res = await fetch("/api/ai/slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(context),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[FORZA] SlipBuilder API error:", res.status, text);
        setError("FORZA AI could not generate slip ideas right now.");
        return;
      }

      const data = await res.json();
      setSuggestions(data.suggestions ?? "No suggestions returned.");
    } catch (err) {
      console.error("[FORZA] SlipBuilder fetch error:", err);
      setError("Network error while talking to FORZA AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs font-semibold text-slate-200">
        Build Your Slip (AI ideas)
      </p>
      <p className="text-[11px] text-slate-400">
        Choose basic markets you like, then let FORZA AI suggest possible
        angles. This is not betting advice, just analysis for entertainment.
      </p>

      {/* Static market buttons for now (just conceptual) */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          1X2: Home
        </button>
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          1X2: Draw
        </button>
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          1X2: Away
        </button>
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          Over 2.5
        </button>
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          Under 2.5
        </button>
        <button className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2">
          BTTS: Yes
        </button>
      </div>

      <button
        onClick={handleAskAi}
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold py-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Asking FORZA AI..." : "Ask FORZA AI for slip ideas"}
      </button>

      {error && (
        <p className="mt-2 text-[11px] text-rose-300">
          {error}
        </p>
      )}

      {suggestions && (
        <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
          <pre className="whitespace-pre-wrap text-[11px] text-emerald-50">
            {suggestions}
          </pre>
        </div>
      )}
    </section>
  );
}