"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/matches", label: "Matches", icon: "⚽" },
  { href: "/communities", label: "Community", icon: "👥" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="
      fixed left-0 right-0 bottom-0 z-40 
      bg-[#050505] 
      border-t border-[#1F1F1F] 
      m-0 p-0
    ">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-0.5 text-[11px]"
              >
                <div
                  className={`flex items-center justify-center h-7 w-7 rounded-full ${
                    active
                      ? "bg-[#00FF47] text-black shadow-[0_0_12px_rgba(0,255,71,0.55)]"
                      : "bg-transparent text-[#A0A0A0]"
                  }`}
                >
                  <span className="text-[15px]">{tab.icon}</span>
                </div>
                <span
                  className={`${
                    active ? "text-[#00FF47]" : "text-[#868686]"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}