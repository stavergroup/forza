"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide full layout on auth pages
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main page content */}
      <div className="pb-20">{children}</div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0A] border-t border-[#1F1F1F] flex items-center justify-around">
        {/* Feed */}
        <a
          href="/"
          className={`flex flex-col items-center text-[11px] ${
            pathname === "/" ? "text-[#A4FF2F]" : "text-[#888]"
          }`}
        >
          <span className="text-[18px]">🏠</span>
        </a>

        {/* Matches */}
        <a
          href="/matches"
          className={`flex flex-col items-center text-[11px] ${
            pathname.startsWith("/matches")
              ? "text-[#A4FF2F]"
              : "text-[#888]"
          }`}
        >
          <span className="text-[18px]">⚽</span>
        </a>

        {/* Build Slip */}
        <a
          href="/build-slip"
          className={`flex flex-col items-center text-[11px] ${
            pathname.startsWith("/build-slip")
              ? "text-[#A4FF2F]"
              : "text-[#888]"
          }`}
        >
          <span className="text-[18px]">🧪</span>
        </a>

        {/* Chat */}
        <a
          href="/chat"
          className={`flex flex-col items-center text-[11px] ${
            pathname.startsWith("/chat")
              ? "text-[#A4FF2F]"
              : "text-[#888]"
          }`}
        >
          <span className="text-[18px]">💬</span>
        </a>

        {/* Profile */}
        <a
          href="/profile"
          className={`flex flex-col items-center text-[11px] ${
            pathname.startsWith("/profile")
              ? "text-[#A4FF2F]"
              : "text-[#888]"
          }`}
        >
          <span className="text-[18px]">👤</span>
        </a>
      </nav>
    </div>
  );
}