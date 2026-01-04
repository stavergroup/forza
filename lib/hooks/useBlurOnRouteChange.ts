"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useBlurOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return;
    const tag = el.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || el.isContentEditable) {
      el.blur();
    }
  }, [pathname]);
}