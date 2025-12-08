"use client";

import { useState } from "react";
import { Star, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import SearchOverlay from "./SearchOverlay";

type SearchContext = "feed-users" | "matches" | "chat";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const context: SearchContext =
    pathname.startsWith("/matches")
      ? "matches"
      : pathname.startsWith("/chat")
        ? "chat"
        : "feed-users";

  return (
    <>
      <header className="px-4 py-3 border-b border-[#1F1F1F] bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-between">

        {/* FORZA Logo */}
        <div
          onClick={() => router.push("/feed")}
          className="h-9 w-9 rounded-xl bg-[#111111] border border-[#1F1F1F] flex items-center justify-center text-[var(--forza-accent)] font-bold text-[13px] cursor-pointer active:scale-95 transition"
        >
          FZ
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Star = Favorites */}
          <Link
            href="/favorites"
            className="p-1.5 rounded-lg hover:bg-[#111111] active:scale-95 transition"
          >
            <Star
              size={20}
              className={pathname === "/favorites" ? "fill-[#a4ff2f] stroke-[#a4ff2f]" : "stroke-[#AAAAAA]"}
            />
          </Link>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#111111] active:scale-95 transition"
          >
            <Search size={20} className="stroke-[#AAAAAA]" />
          </button>
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        context={context}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}