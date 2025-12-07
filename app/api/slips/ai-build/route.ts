import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const API_FOOTBALL_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;

if (!API_FOOTBALL_KEY) {
  console.warn(
    "[FORZA] API_FOOTBALL_KEY is not set. /api/slips/ai-build will not work."
  );
}

type RiskLevel = "safe" | "medium" | "high";

function getPerBetRange(risk: RiskLevel) {
  // These are NOT hard rules, just guidance for the model.
  switch (risk) {
    case "safe":
      // Very small odds allowed. Many selections might be needed.
      return "1.10–1.40";
    case "high":
      // Can mix small and higher odds.
      return "1.25–3.00";
    case "medium":
    default:
      return "1.20–1.80";
  }
}

function productOfOdds(bets: { odds: number | null }[]): number | null {
  const validOdds = bets
    .map((b) => b.odds)
    .filter((o): o is number => typeof o === "number" && o > 1.0);
  if (validOdds.length === 0) return null;
  return validOdds.reduce((acc, o) => acc * o, 1);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    const rawTargetOdds = Number(body.targetOdds || body.target_odds || 0);
    const targetOdds =
      isNaN(rawTargetOdds) || rawTargetOdds <= 1.1 ? 2.0 : rawTargetOdds;

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
        cache: "no-store",
      }
    );

    if (!fixturesRes.ok) {
      const text = await fixturesRes.text();
      console.error(
        "[FORZA] API-FOOTBALL fixtures error:",
        fixturesRes.status,
        text
      );
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

    // Limit fixtures to avoid huge payload
    fixtures = fixtures.slice(0, 40);

    if (fixtures.length === 0) {
      return NextResponse.json(
        {
          error:
            "No fixtures found for today with the given filters. Try removing league filters.",
        },
        { status: 400 }
      );
    }

    const fixtureSummary = fixtures.map((f) => ({
      league: f.league?.name,
      homeTeam: f.teams?.home?.name,
      awayTeam: f.teams?.away?.name,
      kickoff: f.fixture?.date,
    }));

    const perBetRange = getPerBetRange(risk);

    const systemPrompt =
      "You are FORZA, a football betting assistant. You build accumulator slips from real fixtures. " +
      "You must ONLY use the fixtures provided to you. Never invent matches.";

    const userPrompt = `
Build a football bet slip using ONLY these fixtures:

${JSON.stringify(fixtureSummary, null, 2)}

User preferences:
- Target total odds: about ${targetOdds}
- Risk level: ${risk.toUpperCase()}
- You are allowed to use MANY small odds (e.g. 1.10, 1.20, 1.30) if needed.
- Number of selections is flexible. Do NOT force a fixed amount.
- However, do not exceed 15 selections in total.

Guidance for odds per selection (NOT strict rules):
- For SAFE slips, prefer very small odds like ${perBetRange}, mostly strong favourites and safer lines.
- For MEDIUM, you can mix small and medium odds like ${perBetRange}.
- For HIGH, you can include a few higher odds but you may still combine many small odds too.

Allowed markets:
- Match winner (1X2)
- Double chance
- Over/under goals (e.g. Over 1.5, Over 2.5, Under 3.5)
- Both teams to score
- Draw no bet

Important behaviour:
- Choose as many selections as you think are reasonable (for example anywhere between 2 and 15) to get close to the target odds.
- You may use many low-odds selections instead of a few high-odds selections.
- Use only the fixtures provided, and never repeat the same fixture twice.
- The product of all odds should aim to be close to ${targetOdds}, but it does NOT need to be exact.
- Staying in the range ${(targetOdds * 0.6).toFixed(
      2
    )} to ${(targetOdds * 1.6).toFixed(
      2
    )} is acceptable if necessary, but try to be as close as you can.

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

    if (cleanBets.length === 0) {
      return NextResponse.json(
        { error: "AI did not return any valid bets." },
        { status: 500 }
      );
    }

    const actualTotal = productOfOdds(cleanBets);
    const summary =
      typeof parsed.summary === "string" ? parsed.summary : "";
    const strategy =
      typeof parsed.strategy === "string" ? parsed.strategy : "";

    return NextResponse.json({
      bets: cleanBets,
      totalOdds: actualTotal,
      summary,
      strategy,
      targetOddsRequested: targetOdds,
      risk,
    });
  } catch (err: any) {
    console.error("[FORZA] /api/slips/ai-build error:", err);
    return NextResponse.json(
      { error: "Unexpected error building AI slip." },
      { status: 500 }
    );
  }
}