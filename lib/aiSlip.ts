const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "[FORZA] Missing OPENAI_API_KEY in .env.local. AI slip suggestions will be disabled."
  );
}

export type SlipAiContext = {
  homeTeam: string;
  awayTeam: string;
  league: string;
  status: string;
  homeRecentForm?: string[]; // e.g. ["W", "D", "L", "W", "W"]
  awayRecentForm?: string[];
  h2hSummary?: string;
  preferredMarkets?: string[]; // e.g. ["1X2", "Over/Under", "BTTS"]
};

export async function getSlipSuggestionsText(
  context: SlipAiContext
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "FORZA AI is not configured yet (missing OPENAI_API_KEY). Slip suggestions are unavailable.";
  }

  const prompt = `
You are FORZA AI, a football analysis assistant. The app is used by bettors and fans who want ideas for how a match might be played, not guarantees.

You receive context like:
${JSON.stringify(context, null, 2)}

Your job:
- Write 1 short "Summary" paragraph about how this game might play out (style, balance, risk).
- Then list 3 bullet points:
  - Safe angle: something relatively conservative (e.g. goals-based or double chance style), described in natural language.
  - Medium angle: slightly higher risk idea.
  - High-risk angle: bold idea that might happen but is far from guaranteed.

IMPORTANT:
- Do NOT mention real odds or bookmakers.
- Do NOT promise any win or say anything is "sure", "guaranteed", or "fixed".
- Use language like "could", "might", "looks interesting", "one possible angle".
- Keep it under 180 words.

Format exactly like:

Summary: [2–3 short sentences]

- Safe angle: ...
- Medium angle: ...
- High-risk angle: ...
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are FORZA AI, a cautious football analysis assistant. You never promise guaranteed wins or fixed results.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.85,
        max_tokens: 260,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[FORZA] OpenAI slip error:", res.status, text);
      return "FORZA AI could not load slip suggestions right now.";
    }

    const data = await res.json();
    const content =
      data.choices?.[0]?.message?.content ??
      "FORZA AI could not generate slip suggestions.";
    return content.trim();
  } catch (error) {
    console.error("[FORZA] OpenAI slip request failed:", error);
    return "FORZA AI encountered a network error while generating slip suggestions.";
  }
}