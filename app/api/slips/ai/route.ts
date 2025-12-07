import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

type AiRequestBody = {
  targetOdds?: number | null;
  riskLevel?: "safe" | "medium" | "high";
  leagues?: string[];
};

type AiBet = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
  kickoffTime: string; // ISO 8601
};

type AiSlipResponse = {
  bets: AiBet[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiRequestBody;
    const targetOdds = body.targetOdds ?? null;
    const riskLevel = body.riskLevel ?? "medium";
    const leagues = body.leagues ?? [];

    const humanTarget =
      targetOdds && targetOdds > 1 ? `${targetOdds.toFixed(2)}x` : "reasonable";

    const leaguesText =
      leagues.length > 0 ? leagues.join(", ") : "any popular football leagues";

    const systemPrompt =
      "You are FORZA AI, an assistant that builds sensible football bet slips. " +
      "You must respond ONLY as JSON that matches the given schema. " +
      "Use realistic football teams and markets, but you do NOT need to match real fixtures. " +
      "For each selection, provide a plausible kickoffTime in ISO 8601 UTC (e.g. 2025-12-06T17:30:00Z).";

    const userPrompt = [
      `User wants a bet slip with overall target odds around ${humanTarget}.`,
      `Risk level: ${riskLevel} (safe = few lower odds, high = fewer selections but higher odds, medium balanced).`,
      `Preferred leagues: ${leaguesText}.`,
      "",
      "Return between 3 and 10 selections.",
      "Keep odds in a realistic range (1.20–4.50).",
      "",
      "Return JSON with this structure:",
      "{",
      '  "bets": [',
      "    {",
      '      "homeTeam": "string",',
      '      "awayTeam": "string",',
      '      "market": "string",',
      '      "selection": "string",',
      '      "odds": number,',
      '      "kickoffTime": "ISO 8601 UTC string"',
      "    }",
      "  ]",
      "}",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    const parsed = JSON.parse(raw) as AiSlipResponse;

    const bets = (parsed.bets || []).filter(
      (b) =>
        typeof b.homeTeam === "string" &&
        typeof b.awayTeam === "string" &&
        typeof b.market === "string" &&
        typeof b.selection === "string" &&
        typeof b.odds === "number" &&
        !Number.isNaN(b.odds)
    );

    if (!bets.length) {
      return NextResponse.json(
        { error: "FORZA AI failed to build a slip. Try again." },
        { status: 400 }
      );
    }

    const totalOdds = bets.reduce((acc, b) => acc * b.odds, 1);

    return NextResponse.json({
      bets,
      totalOdds,
    });
  } catch (err) {
    console.error("[FORZA] Ask-AI route error:", err);
    return NextResponse.json(
      { error: "Something went wrong talking to FORZA AI." },
      { status: 500 }
    );
  }
}