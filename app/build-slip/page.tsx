import Header from "@/components/Header";

import BetpawaBookingImport from "@/components/BetpawaBookingImport";
import SlipUpload from "@/components/SlipUpload";
import AiSlipBuilder from "@/components/AiSlipBuilder";

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

          <SlipUpload />
        </section>

        <section className="mb-4">
          <BetpawaBookingImport />
        </section>

        {/* AI generate slip section */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5">
          <AiSlipBuilder />
        </section>
      </div>
    </>
  );
}