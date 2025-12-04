"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
  icon: string;
};

const TABS: TabItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/matches", label: "Matches", icon: "⚽" },
  { href: "/communities", label: "Community", icon: "👥" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Normalize active route (e.g. /matches/123 -> /matches)
  const activeBase = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20">
      <div className="mx-auto max-w-md">
        <div className="mx-3 mb-3 rounded-2xl border border-slate-800/90 bg-slate-950/90 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between px-2 py-1">
            {TABS.map((tab) => {
              const isActive = activeBase === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex-1"
                >
                  <div className="flex flex-col items-center justify-center py-1.5 gap-0.5">
                    <span
                      className={`text-base leading-none ${
                        isActive ? "scale-110" : "opacity-80"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={`text-[10px] ${
                        isActive
                          ? "text-emerald-300 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="mt-0.5 h-0.5 w-6 rounded-full bg-emerald-400/80" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}