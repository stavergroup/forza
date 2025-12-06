import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const API_FOOTBALL_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;

if (!API_FOOTBALL_KEY) {
  console.warn(
    "[FORZA] API_FOOTBALL_KEY is not set. /api/slips/ai-build will not work."
  );
}

type RiskLevel = "safe" | "medium" | "high";

function getRiskConfig(risk: RiskLevel) {
  switch (risk) {
    case "safe":
      return { minBets: 2, maxBets: 3, targetPerBet: "1.25–1.50" };
    case "high":
      return { minBets: 4, maxBets: 6, targetPerBet: "1.70–3.00" };
    case "medium":
    default:
      return { minBets: 3, maxBets: 4, targetPerBet: "1.40–1.80" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const rawTargetOdds = Number(body.targetOdds || body.target_odds || 0);
    const targetOdds = isNaN(rawTargetOdds) || rawTargetOdds <= 0
      ? 5.0
      : rawTargetOdds;

    const risk: RiskLevel = (body.risk || "medium").toLowerCase();
    const leagues: string[] = Array.isArray(body.leagues) ? body.leagues : [];

    if (!API_FOOTBALL_KEY) {
      return NextResponse.json(
        { error: "API_FOOTBALL_KEY missing in environment" },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    // Fetch today's fixtures from API-FOOTBALL
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      {
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY,
        },
        // avoid cache because odds change
        cache: "no-store",
      }
    );

    if (!fixturesRes.ok) {
      const text = await fixturesRes.text();
      console.error("[FORZA] API-FOOTBALL fixtures error:", fixturesRes.status, text);
      return NextResponse.json(
        { error: "Failed to fetch fixtures from API-FOOTBALL" },
        { status: 502 }
      );
    }

    const fixturesJson = (await fixturesRes.json()) as any;
    let fixtures: any[] = fixturesJson.response || [];

    // Optional league filtering by league name
    if (leagues.length > 0) {
      const lcLeagues = leagues.map((l: string) => l.toLowerCase());
      fixtures = fixtures.filter((f) => {
        const leagueName = (f.league?.name || "").toLowerCase();
        return lcLeagues.some((l) => leagueName.includes(l));
      });
    }

    // Limit to reasonable size for the model
    fixtures = fixtures.slice(0, 40);

    if (fixtures.length === 0) {
      return NextResponse.json(
        { error: "No fixtures found for today with the given filters." },
        { status: 400 }
      );
    }

    const fixtureSummary = fixtures.map((f) => ({
      league: f.league?.name,
      homeTeam: f.teams?.home?.name,
      awayTeam: f.teams?.away?.name,
      kickoff: f.fixture?.date,
    }));

    const riskCfg = getRiskConfig(risk);

    const systemPrompt =
      "You are FORZA, a football betting assistant. You build sensible accumulator slips from real fixtures. " +
      "You must ONLY use the fixtures provided to you. Never invent matches.";

    const userPrompt = `
Build a football bet slip using ONLY these fixtures:

${JSON.stringify(fixtureSummary, null, 2)}

User preferences:
- Target total odds: about ${targetOdds}
- Risk level: ${risk.toUpperCase()} (bets per slip: ${riskCfg.minBets}-${riskCfg.maxBets}, typical odds ${riskCfg.targetPerBet})
- Allowed markets: match winner (1X2), double chance, over/under goals (like Over 2.5), both teams to score, draw no bet.
- Avoid exotic or very rare markets.

Rules:
- Choose between ${riskCfg.minBets} and ${riskCfg.maxBets} bets.
- For each bet, pick a simple, understandable market.
- Total odds do NOT need to be exact. Close is fine.
- Use decimal odds (e.g. 1.45, 1.80, 2.10).
- DO NOT repeat the same fixture twice.
- DO NOT invent new teams or matches.

Return STRICT JSON in this shape (no explanation outside JSON):

{
  "bets": [
    {
      "homeTeam": "string",
      "awayTeam": "string",
      "market": "string",
      "selection": "string",
      "odds": number
    }
  ],
  "totalOdds": number,
  "summary": "short text summary of the slip in 1-2 sentences",
  "strategy": "describe why this fits the risk level and target odds in 2-4 sentences"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[FORZA] AI build slip JSON parse error:", err, raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON for slip." },
        { status: 500 }
      );
    }

    const bets = Array.isArray(parsed.bets) ? parsed.bets : [];
    const cleanBets = bets
      .filter(
        (b: any) =>
          b &&
          typeof b.homeTeam === "string" &&
          typeof b.awayTeam === "string" &&
          typeof b.market === "string" &&
          typeof b.selection === "string"
      )
      .map((b: any) => ({
        homeTeam: b.homeTeam,
        awayTeam: b.awayTeam,
        market: b.market,
        selection: b.selection,
        odds:
          typeof b.odds === "number"
            ? b.odds
            : Number(b.odds) || null,
      }));

    const totalOdds =
      typeof parsed.totalOdds === "number"
        ? parsed.totalOdds
        : Number(parsed.totalOdds) || null;

    const summary =
      typeof parsed.summary === "string" ? parsed.summary : "";
    const strategy =
      typeof parsed.strategy === "string" ? parsed.strategy : "";

    if (cleanBets.length === 0) {
      return NextResponse.json(
        { error: "AI did not return any valid bets." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bets: cleanBets,
      totalOdds,
      summary,
      strategy,
    });
  } catch (err: any) {
    console.error("[FORZA] /api/slips/ai-build error:", err);
    return NextResponse.json(
      { error: "Unexpected error building AI slip." },
      { status: 500 }
    );
  }
}