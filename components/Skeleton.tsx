"use client";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-slate-800/60 relative ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-[skeleton_1.3s_ease-in-out_infinite]" />
      <div className="opacity-0">.</div>
      <style jsx>{`
        @keyframes skeleton {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}