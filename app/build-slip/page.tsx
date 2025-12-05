import Header from "@/components/Header";

export default function BuildSlipPage() {
  return (
    <>
      <Header />
      <div className="p-4 space-y-4 text-sm">
        {/* Intro card */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-2">
          <p className="text-[11px] text-[#B5B5B5] uppercase tracking-[0.16em]">
            Build Slip
          </p>
          <p className="text-[12px] text-[#E5E5E5]">
            Upload your existing slip or let FORZA AI propose a new one based on
            your budget and risk level.
          </p>
        </section>

        {/* Upload slip section */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#E5E5E5] font-medium">
              Upload your slip
            </p>
            <span className="text-[11px] text-[#888]">Image or text</span>
          </div>

          {/* Upload area (mock) */}
          <label className="block rounded-2xl border border-dashed border-[#2A2A2A] bg-[#0B0B0B] px-4 py-6 text-center cursor-pointer hover:border-[#A4FF2F] transition-colors">
            <div className="text-[22px] mb-1">📷</div>
            <p className="text-[12px] text-[#E5E5E5]">
              Tap to upload slip screenshot
            </p>
            <p className="text-[10px] text-[#777] mt-1">
              We’ll read teams, markets and odds for you.
            </p>
          </label>

          {/* Or paste text */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#B5B5B5]">Or paste slip text</p>
            <textarea
              className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[12px] text-[#E5E5E5] placeholder:text-[#555] outline-none resize-none h-20"
              placeholder="Example: PSG win @1.50, Arsenal vs Chelsea BTTS @1.95..."
              readOnly
            />
          </div>

          <button className="w-full rounded-xl bg-[#A4FF2F] text-black text-[12px] font-semibold py-2.5 hover:brightness-95 active:scale-[0.97] transition">
            Analyze slip (mock)
          </button>
        </section>

        {/* AI generate slip section */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#E5E5E5] font-medium">
              Ask AI to build a slip
            </p>
            <span className="text-[11px] text-[#A4FF2F]">FORZA AI</span>
          </div>

          {/* Target total odds */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">
              Target total odds
            </label>
            <div className="flex items-center rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2">
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-[13px] text-[#E5E5E5] placeholder:text-[#555]"
                placeholder="Example: 3.0 · 5.5 · 10 · 20 (mock)"
                readOnly
              />
            </div>
            <p className="text-[10px] text-[#777]">
              Tell FORZA AI how many total odds you want it to target.
            </p>
          </div>

          {/* Risk level */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">Risk level</label>
            <div className="flex gap-2 text-[11px]">
              <button className="flex-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] py-1.5 text-[#B5B5B5]">
                Safe
              </button>
              <button className="flex-1 rounded-full bg-[#0B0B0B] border border-[#A4FF2F] py-1.5 text-[#A4FF2F]">
                Medium
              </button>
              <button className="flex-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] py-1.5 text-[#B5B5B5]">
                High
              </button>
            </div>
          </div>

          {/* Leagues */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">
              Focus leagues (optional)
            </label>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button className="px-3 py-1 rounded-full bg-[#0B0B0B] border border-[#A4FF2F] text-[#A4FF2F]">
                Premier League
              </button>
              <button className="px-3 py-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] text-[#B5B5B5]">
                La Liga
              </button>
              <button className="px-3 py-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] text-[#B5B5B5]">
                Serie A
              </button>
              <button className="px-3 py-1 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] text-[#B5B5B5]">
                Champions League
              </button>
            </div>
          </div>

          <button className="w-full rounded-2xl bg-[#A4FF2F] text-black text-[13px] font-semibold py-2.5 hover:brightness-95 active:scale-[0.97] transition">
            Ask AI to generate slip (mock)
          </button>
        </section>

        {/* Previous AI slips (mock history) */}
        <section className="pb-4 space-y-2">
          <p className="text-[11px] text-[#B5B5B5]">Recent AI slips (mock)</p>
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#E5E5E5]">3-pick combo · 4.10x</span>
              <span className="text-[#777]">Yesterday</span>
            </div>
            <ul className="text-[#CCCCCC] space-y-0.5">
              <li>• PSG win & Over 1.5</li>
              <li>• Both teams to score (London derby)</li>
              <li>• Inter draw no bet</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}