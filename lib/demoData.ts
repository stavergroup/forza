export type DemoMatch = {
  id: string;
  league: string;
  time: string;
  status: "LIVE" | "FT" | "NS";
  home: string;
  away: string;
  score?: string;
  aiEdge?: string;
};

export const demoMatches: DemoMatch[] = [
  {
    id: "m1",
    league: "Premier League",
    time: "19:30",
    status: "NS",
    home: "Manchester City",
    away: "Liverpool",
    aiEdge: "Home 62%",
  },
  {
    id: "m2",
    league: "LaLiga",
    time: "22:00",
    status: "LIVE",
    home: "Real Madrid",
    away: "Barcelona",
    score: "1 - 0",
    aiEdge: "Over 2.5",
  },
  {
    id: "m3",
    league: "NBC Tanzania",
    time: "16:00",
    status: "FT",
    home: "Yanga SC",
    away: "Simba SC",
    score: "2 - 2",
    aiEdge: "BTTS",
  },
];

export type DemoCommunity = {
  id: string;
  name: string;
  members: number;
  topic: string;
};

export type DemoMessage = {
  id: string;
  communityId: string;
  user: string;
  text: string;
  time: string;
  isOwn?: boolean;
};

export const demoCommunities: DemoCommunity[] = [
  {
    id: "c1",
    name: "Manchester United Fans",
    members: 15432,
    topic: "Premier League talk, lineups, transfers & match reactions.",
  },
  {
    id: "c2",
    name: "Yanga & Simba 🇹🇿",
    members: 8421,
    topic: "NBC Tanzania League, derby talk and local slips.",
  },
  {
    id: "c3",
    name: "AFCON 2025 Room",
    members: 5632,
    topic: "National team debates, predictions and live match threads.",
  },
];

export const demoMessages: DemoMessage[] = [
  {
    id: "m1",
    communityId: "c2",
    user: "Juma",
    text: "Yanga leo wanaanza na wachezaji gani? Nadhani watashinda 2-1.",
    time: "19:02",
  },
  {
    id: "m2",
    communityId: "c2",
    user: "You",
    text: "Naona game inaweza kuwa draw. BTTS inaonekana poa sana.",
    time: "19:05",
    isOwn: true,
  },
  {
    id: "m3",
    communityId: "c2",
    user: "Sara",
    text: "Mimi nacheza over 2.5. Mashambulizi yatakuwa mengi sana.",
    time: "19:07",
  },
  {
    id: "m4",
    communityId: "c1",
    user: "Alex",
    text: "If we don't sign a proper striker, top 4 will be hard.",
    time: "13:25",
  },
  {
    id: "m5",
    communityId: "c3",
    user: "Samir",
    text: "AFCON 2025 will be crazy, I think Tanzania can surprise people.",
    time: "10:11",
  },
];

export type DemoUser = {
  id: string;
  username: string;
  displayName: string;
  country: string;
  streakDays: number;
  winRate: number;
  slipsCreated: number;
  followers: number;
  following: number;
};

export const demoUser: DemoUser = {
  id: "u1",
  username: "forza_ceo",
  displayName: "FORZA Demo User",
  country: "Tanzania",
  streakDays: 5,
  winRate: 63,
  slipsCreated: 27,
  followers: 124,
  following: 38,
};

export type DemoPost = {
  id: string;
  user: string;
  avatarInitials: string;
  text: string;
  matchId?: string;
  createdAt: string;
};

export const demoPosts: DemoPost[] = [
  {
    id: "p1",
    user: "Saito",
    avatarInitials: "SA",
    text: "Man City vs Liverpool leo naona game inaenda over 2.5, lakini draw pia ina nafasi sana.",
    matchId: "m1",
    createdAt: "5 min ago",
  },
  {
    id: "p2",
    user: "Aisha",
    avatarInitials: "AI",
    text: "Real vs Barca, BTTS for me. Defenders wako shaky sana lately 😂",
    matchId: "m2",
    createdAt: "22 min ago",
  },
  {
    id: "p3",
    user: "Juma",
    avatarInitials: "JU",
    text: "Yanga vs Simba kila siku ni pressure. Over 2.5 ama BTTS tu.",
    matchId: "m3",
    createdAt: "1 hr ago",
  },
];