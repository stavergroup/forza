"use client";

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="relative w-full max-w-md border-x border-[#1F1F1F] bg-[#050505]">
        <main className="min-h-screen pb-24 p-4 space-y-5">
          {/* Simple post skeleton */}
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-700/40 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-700/40 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-700/40 rounded animate-pulse" />
              </div>
            </div>

            {/* Slip card skeleton */}
            <div className="rounded-xl border border-gray-700/30 p-4 space-y-3">
              <div className="h-3 w-1/2 bg-gray-700/40 rounded-md animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-700/40 rounded-md animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-700/40 rounded-md animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-700/40 rounded-md animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-700/40 rounded-md animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}