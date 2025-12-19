export type SlipLabel = {
  tier: "SAFE" | "BALANCED" | "HIGH_RISK";
  badges: string[];
  labelText: string;
  tierColor: string;
  badgeColors: Record<string, string>;
};

export type SlipForLabel = {
  totalOdds: number;
  selections: Array<{
    kickoffTime?: string | null;
  }>;
  source?: string;
};

export function computeSlipLabel(slip: SlipForLabel): SlipLabel {
  const { totalOdds, selections, source } = slip;
  const numberOfSelections = selections.length;
  const now = new Date();

  // Check for LIVE badge
  const hasLive = selections.some((sel) => {
    if (!sel.kickoffTime) return false;
    const kickoff = new Date(sel.kickoffTime);
    return kickoff < now;
  });

  let tier: "SAFE" | "BALANCED" | "HIGH_RISK";
  let badges: string[] = [];

  // Priority: LIVE first (badge)
  if (hasLive) {
    badges.push("LIVE");
  }

  // HIGH_RISK tier
  if (totalOdds > 10 || numberOfSelections >= 7) {
    tier = "HIGH_RISK";
  }
  // BALANCED tier
  else if (
    totalOdds > 3 &&
    totalOdds <= 10 &&
    numberOfSelections >= 3 &&
    numberOfSelections <= 6 &&
    !hasLive
  ) {
    tier = "BALANCED";
  }
  // SAFE tier
  else if (totalOdds <= 3 && numberOfSelections <= 3 && !hasLive) {
    tier = "SAFE";
  } else {
    // Default to HIGH_RISK if doesn't fit others
    tier = "HIGH_RISK";
  }

  // AI badge
  if (source === "ai") {
    badges.push("AI");
  }

  // labelText
  const parts = [...badges, tier];
  const labelText = parts.join(" • ");

  // Colors
  const tierColor = {
    SAFE: "text-[#a4ff2f]", // soft green aligned with accent
    BALANCED: "text-yellow-400",
    HIGH_RISK: "text-red-500",
  }[tier];

  const badgeColors: Record<string, string> = {
    LIVE: "text-orange-400",
    AI: "text-blue-400",
  };

  return {
    tier,
    badges,
    labelText,
    tierColor,
    badgeColors,
  };
}