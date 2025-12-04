"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ForzaLogo from "./ForzaLogo";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full px-4 pt-3 pb-2 bg-transparent">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ForzaLogo size={28} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">
              FORZA
            </span>
            <span className="text-[10px] text-slate-400">
              Football · AI · Community
            </span>
          </div>
        </Link>
        <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-200">
          {pathname === "/" ? "Smart feed" : "Live beta"}
        </span>
      </div>
    </header>
  );
}