export type ForzaSelection = {
  match: string;
  kickoff?: string;
  marketGroup?: string;
  pick: string;
  odds: number;
};

export type ForzaSlip = {
  bookmaker: "betpawa_tz";
  code: string;
  totalOdds: number;
  selections: ForzaSelection[];
};

export function normalizeBetpawaSlip(raw: any, code: string): ForzaSlip {
  const items = Array.isArray(raw?.items) ? raw.items : [];

  const selections: ForzaSelection[] = items.map((item: any) => {
    const event = item?.event ?? {};
    const market = item?.market ?? {};
    const price = item?.price ?? {};
    const marketType = market?.marketType ?? {};

    return {
      match: event.name ?? "Unknown match",
      kickoff: event.startTime ?? "",
      marketGroup: marketType.displayName ?? marketType.name ?? "",
      pick: price.displayName ?? price.name ?? "",
      odds: Number(price.price ?? 0),
    };
  });

  const totalOdds =
    selections.length > 0
      ? selections.reduce(
          (acc, sel) => (sel.odds && sel.odds > 0 ? acc * sel.odds : acc),
          1
        )
      : 0;

  return {
    bookmaker: "betpawa_tz",
    code,
    totalOdds,
    selections,
  };
}