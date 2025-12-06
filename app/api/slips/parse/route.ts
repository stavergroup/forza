import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const prompt = `
You are reading a FOOTBALL betting slip image (e.g. BetPawa, SportPesa, Betika).

Your job:

1. Read ALL football bets from the slip.
2. For each bet, extract:
   - homeTeam: string
   - awayTeam: string
   - market: string  (e.g. 1X2, Over/Under, BTTS, Double Chance, etc.)
   - selection: string  (e.g. Home, Draw, Over 2.5, BTTS Yes, 1X, etc.)
   - odds: number | null (if visible)
3. Also extract:
   - bookmaker: string | null  (e.g. "BetPawa")
   - bookingCode: string | null (any code or reference)
4. Provide a rawText field with your full interpretation of the slip for debug.

Respond ONLY with valid JSON in this shape:

{
  "bookmaker": string | null,
  "bookingCode": string | null,
  "bets": [
    {
      "homeTeam": string,
      "awayTeam": string,
      "market": string,
      "selection": string,
      "odds": number | null
    }
  ],
  "rawText": string
}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("[FORZA] Failed to parse slip JSON:", text);
      return NextResponse.json(
        { error: "Failed to parse slip data", raw: text },
        { status: 500 }
      );
    }

    // Basic normalization
    if (!Array.isArray(parsed.bets)) {
      parsed.bets = [];
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[FORZA] Slip parse error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}