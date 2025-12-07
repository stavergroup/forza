import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const API_FOOTBALL_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

type AiRequestBody = {
  targetOdds?: number | null;
  riskLevel?: "safe" | "medium" | "high";
  leagues?: string[];
};

type Fixture = {
  fixture: {
    id: number;
    date: string; // ISO
  };
  league: {
    name: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
};

type AiChoice = {
  fixtureId: number;
  market: string;
  selection: string;
  odds: number;
};

type AiResponse = {
  picks: AiChoice[];
};

async function fetchTodayFixtures(): Promise<Fixture[]> {
  if (!API_FOOTBALL_KEY) {
    console.error("[FORZA] Missing API_FOOTBALL_KEY");
    return [];
  }

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(today.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const url = `${API_FOOTBALL_BASE}/fixtures?date=${dateStr}`;

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
    },
    // prevent edge caching of stale fixtures
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[FORZA] API-FOOTBALL error:", res.status, await res.text());
    return [];
  }

  const json = await res.json();
  return (json.response || []) as Fixture[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiRequestBody;
    const targetOdds = body.targetOdds ?? null;
    const riskLevel = body.riskLevel ?? "medium";

    const fixtures = await fetchTodayFixtures();

    if (!fixtures.length) {
      return NextResponse.json(
        { error: "No fixtures found for today. Try again later." },
        { status: 400 }
      );
    }

    // Build a compact list for the model
    const compactFixtures = fixtures.slice(0, 60).map((f) => ({
      id: f.fixture.id,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      league: f.league.name,
      kickoffTime: f.fixture.date,
    }));

    const humanTarget =
      targetOdds && targetOdds > 1 ? `${targetOdds.toFixed(2)}x` : "reasonable";

    const systemPrompt =
      "You are FORZA AI. You build sensible football bet slips using ONLY the fixtures provided by the user. " +
      "You must return JSON that matches the given schema. " +
      "Do not invent teams; always reference fixtureId from the list.";

    const userPrompt = [
      "Here is today's fixtures list (JSON):",
      JSON.stringify(compactFixtures),
      "",
      `User wants a slip with overall target odds around ${humanTarget}.`,
      `Risk level: ${riskLevel} (safe = more low odds, high = fewer selections but higher odds, medium balanced).`,
      "Choose between 3 and 10 fixtures from the list.",
      "For each, return: fixtureId, market, selection, and a realistic odds between 1.20 and 4.50.",
      "",
      "Return JSON with this structure:",
      "{",
      '  "picks": [',
      "    {",
      '      "fixtureId": number,',
      '      "market": "string",',
      '      "selection": "string",',
      '      "odds": number',
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

    const parsed = JSON.parse(raw) as AiResponse;

    const fixtureMap = new Map<number, Fixture>();
    for (const f of fixtures) {
      fixtureMap.set(f.fixture.id, f);
    }

    const bets = (parsed.picks || [])
      .map((p) => {
        const fx = fixtureMap.get(p.fixtureId);
        if (!fx) return null;
        if (typeof p.odds !== "number" || Number.isNaN(p.odds)) return null;

        return {
          homeTeam: fx.teams.home.name,
          awayTeam: fx.teams.away.name,
          market: p.market,
          selection: p.selection,
          odds: p.odds,
          kickoffTime: fx.fixture.date,
          league: fx.league.name,
        };
      })
      .filter(Boolean) as any[];

    if (!bets.length) {
      return NextResponse.json(
        { error: "FORZA AI could not build a slip from today's fixtures." },
        { status: 400 }
      );
    }

    const totalOdds = bets.reduce((acc, b) => acc * (b.odds || 1), 1);

    return NextResponse.json({
      bets,
      totalOdds,
    });
  } catch (err) {
    console.error("[FORZA] Ask-AI fixtures route error:", err);
    return NextResponse.json(
      { error: "Something went wrong building the AI slip." },
      { status: 500 }
    );
  }
}