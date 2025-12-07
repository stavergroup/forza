import Header from "@/components/Header";
import LiveFeedSection from "@/components/LiveFeedSection";

type DemoPost = {
  id: number;
  user: string;
  time: string;
  text: string;
  matchTag?: string;
  hasSlip?: boolean;
};

const demoPosts: DemoPost[] = [
  {
    id: 1,
    user: "SlipMaster",
    time: "2h",
    text: "PSG looking sharp today. I expect them to control the game from early on.",
    matchTag: "PSG vs Marseille",
    hasSlip: true,
  },
  {
    id: 2,
    user: "DerbyTalk",
    time: "4h",
    text: "London derby always crazy. I see cards and late drama here.",
    matchTag: "Arsenal vs Chelsea",
    hasSlip: false,
  },
  {
    id: 3,
    user: "ValueHunter",
    time: "6h",
    text: "Odds look generous on the underdog, but I only trust them on +1.5 handicap.",
    matchTag: "Inter vs Milan",
    hasSlip: true,
  },
];

export default function FeedPage() {
  return (
    <>
      <Header />
      <div className="p-4 space-y-5 text-sm">
        {/* Composer */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3 shadow-[0_18px_40px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-[1px]">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[11px] text-[var(--forza-accent)] font-semibold">
              FZ
            </div>
            <div className="flex-1 space-y-2">
              <div className="rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2.5 text-[12px] text-[#888]">
                Share your football take…
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#888]">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--forza-accent)]" />
                    <span>Attach match</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#888]" />
                    <span>Attach slip</span>
                  </button>
                </div>
                <button className="px-4 py-1.5 rounded-full bg-[var(--forza-accent)] text-black text-[11px] font-semibold hover:brightness-95 active:scale-[0.97] transition-all">
                  Post
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Match highlights row */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#B5B5B5]">Match highlights</span>
            <span className="text-[#888] hover:text-[var(--forza-accent)] transition-colors">
              View all
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {/* LIVE */}
            <div className="flex-shrink-0 w-20">
              <div className="rounded-2xl border border-[var(--forza-accent)] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  LIVE
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Live now
                </p>
              </div>
            </div>
            {/* AI Pick */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#0B0B0B] flex items-center justify-center text-[10px] text-[var(--forza-accent)]">
                  AI
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  AI hot pick
                </p>
              </div>
            </div>
            {/* Trending match */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  ⚽
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Big derby
                </p>
              </div>
            </div>
            {/* Hot slip */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  🎟
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Hot slip
                </p>
              </div>
            </div>
            {/* League */}
            <div className="flex-shrink-0 w-24">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] px-2 py-3 flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-[2px]">
                <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px]">
                  🏆
                </div>
                <p className="text-[10px] text-center text-[#B5B5B5]">
                  Premier Lg
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feed posts */}
        <section className="space-y-4">
          {demoPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-2.5 transition-transform duration-200 hover:-translate-y-[1px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[10px] text-[var(--forza-accent)]">
                    {post.user[0].toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[12px] font-medium">{post.user}</p>
                    <p className="text-[10px] text-[#888]">{post.time} ago</p>
                  </div>
                </div>
                <span className="text-[12px] text-[#555]">•••</span>
              </div>

              {/* Text */}
              <p className="text-[12px] text-[#E5E5E5] leading-relaxed">
                {post.text}
              </p>

              {/* Match tag */}
              {post.matchTag && (
                <div className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] px-2.5 py-1 text-[10px] text-[#B5B5B5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--forza-accent)]" />
                  <span>{post.matchTag}</span>
                </div>
              )}

              {/* Slip preview */}
              {post.hasSlip && (
                <div className="mt-1.5 rounded-xl border border-[var(--forza-accent)]/20 bg-[#0B0B0B] p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#B5B5B5]">Slip preview</span>
                    <span className="text-[var(--forza-accent)] font-medium">
                      3-pick · 5.21x
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-[#CCCCCC]">
                    <li>• PSG vs Marseille — Over 1.5</li>
                    <li>• Arsenal vs Chelsea — Both teams to score</li>
                    <li>• Inter vs Milan — Inter draw no bet</li>
                  </ul>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <button className="flex-1 rounded-lg border border-[var(--forza-accent)]/33 text-[var(--forza-accent)] py-1 hover:bg-[#111111] transition-colors">
                      Save slip
                    </button>
                    <button className="flex-1 rounded-lg bg-[var(--forza-accent)] text-black font-semibold py-1 hover:brightness-95 active:scale-[0.97] transition-all">
                      Build slip
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#888]">
                <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                  <span>♡</span>
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                  <span>💬</span>
                  <span>Comment</span>
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                  <span>↗</span>
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--forza-accent)] transition-colors">
                  <span>⭐</span>
                  <span>Save</span>
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Live feed from Firestore */}
        <LiveFeedSection />
      </div>
    </>
  );
}