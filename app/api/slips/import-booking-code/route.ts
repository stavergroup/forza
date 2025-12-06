import { NextResponse } from "next/server";
import { fetchFromBetpawaTz } from "@/lib/bookmakers/betpawa-tz";
import {
  normalizeBetpawaSlip,
  ForzaSlip,
} from "@/lib/bookmakers/normalize-betpawa";

type Body = {
  bookmaker?: string;
  code?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const bookmaker = body.bookmaker;
    const code = body.code?.trim();

    if (!bookmaker || !code) {
      return NextResponse.json(
        { error: "Missing bookmaker or code" },
        { status: 400 }
      );
    }

    if (bookmaker !== "betpawa_tz") {
      return NextResponse.json(
        { error: "Bookmaker not supported yet" },
        { status: 400 }
      );
    }

    const raw = await fetchFromBetpawaTz(code);
    const slip: ForzaSlip = normalizeBetpawaSlip(raw, code);

    if (!slip.selections.length) {
      return NextResponse.json(
        { error: "No selections found for this code" },
        { status: 404 }
      );
    }

    return NextResponse.json({ slip });
  } catch (err) {
    console.error("[FORZA] import-booking-code error:", err);
    return NextResponse.json(
      { error: "Failed to import booking code from BetPawa" },
      { status: 500 }
    );
  }
}