"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import BottomNav from "./BottomNav";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthRoute =
    pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register") || pathname === "/auth";

  // Protect non-auth routes
  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      router.replace("/auth/login");
    }
  }, [user, loading, isAuthRoute, router]);

  // While checking auth, show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-[#B5B5B5] text-sm">
        Checking session…
      </div>
    );
  }

  // If not logged in and on non-auth route, we are redirecting; render nothing
  if (!user && !isAuthRoute) {
    return null;
  }

  // Normal app frame
  return (
    <div className="min-h-screen flex justify-center bg-[#0A0A0A] text-white">
      <div className="relative w-full max-w-md border-x border-[#1F1F1F] bg-[#050505]">
        <main className={isAuthRoute ? "min-h-screen" : "min-h-screen pb-24"}>
          {children}
        </main>
        {/* Hide bottom nav on auth routes */}
        {!isAuthRoute && <BottomNav />}
      </div>
    </div>
  );
}