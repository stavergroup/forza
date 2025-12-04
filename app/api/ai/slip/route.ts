import { NextResponse } from "next/server";
import { getSlipSuggestionsText, SlipAiContext } from "@/lib/aiSlip";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SlipAiContext;

    const suggestions = await getSlipSuggestionsText(body);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[FORZA] /api/ai/slip error:", error);
    return NextResponse.json(
      { error: "Failed to generate slip suggestions." },
      { status: 500 }
    );
  }
}