const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "[FORZA] Missing OPENAI_API_KEY in .env.local. AI insights will be disabled."
  );
}

export type MatchAiContext = {
  homeTeam: string;
  awayTeam: string;
  league: string;
  status: string;
  homeRecentForm?: string[]; // e.g. ["W", "D", "L", "W", "W"]
  awayRecentForm?: string[];
  h2hSummary?: string; // short text summary if we want
  notes?: string; // optional extra info
};

export async function getMatchInsightText(
  context: MatchAiContext
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "FORZA AI is not configured yet. Please add OPENAI_API_KEY in .env.local.";
  }

  const prompt = `
You are FORZA AI, a football prediction assistant. The app is used by bettors and fans who want a quick feel of the game, not guaranteed outcomes.

Here is the match context in JSON:
${JSON.stringify(context, null, 2)}

Your job:
- Write 2–3 short sentences describing the match (style, balance, risk).
- Then give 2 bullet points with potential angles like:
  - Safe angle (lower risk)
  - Risky angle (higher reward)
- Do NOT mention odds or any betting brand.
- Do NOT promise wins. Use language like "could", "might", "looks interesting".

Format exactly like this example:

Summary: [your 2–3 sentences here]

- Safe angle: [one idea]
- Risky angle: [one idea]
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
              "You are FORZA AI, a helpful football analysis assistant. You never promise guaranteed wins.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 250,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[FORZA] OpenAI error:", res.status, text);
      return "FORZA AI could not load insights right now.";
    }

    const data = await res.json();
    const content =
      data.choices?.[0]?.message?.content ??
      "FORZA AI could not generate insights.";
    return content.trim();
  } catch (error) {
    console.error("[FORZA] OpenAI request failed:", error);
    return "FORZA AI encountered a network error while generating insights.";
  }
}