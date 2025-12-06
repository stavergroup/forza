"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Rss,
  Target,
  ListChecks,
  MessageCircle,
  User,
} from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/matches", label: "Matches", icon: Target },
  { href: "/build-slip", label: "Build Slip", icon: ListChecks },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#050505] border-t border-[#1F1F1F]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-4 py-2">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href !== "/feed" && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex items-center justify-center py-1 transition-all duration-200 ${
                  active ? "text-[#A4FF2F]" : "text-[#7A7A7A]"
                }`}
              >
                <div
                  className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 ${
                    active ? "bg-[#111111] shadow-[0_0_20px_rgba(164,255,47,0.25)]" : ""
                  }`}
                >
                  <Icon
                    size={20}
                    className={active ? "stroke-[#A4FF2F]" : "stroke-[#9A9A9A]"}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}