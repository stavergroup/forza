import { getMatchInsightText, MatchAiContext } from "@/lib/ai";

export default async function AiTestPage() {
  const context: MatchAiContext = {
    homeTeam: "Yanga SC",
    awayTeam: "Simba SC",
    league: "NBC Tanzania Premier League",
    status: "NS",
    homeRecentForm: ["W", "W", "D", "L", "W"],
    awayRecentForm: ["D", "W", "W", "W", "L"],
    h2hSummary:
      "These teams usually play intense derbies with goals on both sides.",
    notes:
      "This is only a test context from the FORZA development environment.",
  };

  const insight = await getMatchInsightText(context);

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header>
        <h1 className="text-lg font-semibold">FORZA AI · Test</h1>
        <p className="text-xs text-slate-400">
          This page is only for development to verify OpenAI is working.
        </p>
      </header>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <pre className="whitespace-pre-wrap text-xs text-emerald-50">
          {insight}
        </pre>
      </section>
    </main>
  );
}