"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, User } from "firebase/auth";
import { demoUser } from "@/lib/demoData";
import MySlipsList from "@/components/MySlipsList";

const provider = new GoogleAuthProvider();

export default function ProfilePageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    if (signingIn) return;
    try {
      setAuthError(null);
      setSigningIn(true);
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("[FORZA] Profile Google sign-in error:", err);
      if (err.code !== 'auth/cancelled-popup-request') {
        setAuthError("Sign-in failed. Check console for details.");
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      setAuthError(null);
      await signOut(auth);
    } catch (err: any) {
      console.error("[FORZA] Profile sign-out error:", err);
      setAuthError("Sign-out failed. Check console for details.");
    }
  }

  const statsUser = demoUser; // placeholder stats for now

  if (authLoading) {
    return (
      <main className="px-4 pt-4 pb-4 space-y-4">
        <p className="text-xs text-slate-400">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header className="mb-2">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-xs text-slate-400">
          Your FORZA account. Later we will show real stats from your slips and activity.
        </p>
      </header>

      {/* User card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-sm font-bold text-slate-950">
          {(user?.displayName || statsUser.displayName)
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-100">
            {user?.displayName || "Guest user"}
          </p>
          <p className="text-[11px] text-slate-400">
            {user?.email || "@guest"}
          </p>
          {user && (
            <p className="text-[10px] text-slate-500 break-all">
              UID: {user.uid}
            </p>
          )}
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-400/40 text-emerald-300">
          {user ? "Signed in" : "Guest"}
        </span>
      </section>

      {/* Auth actions */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
        {user ? (
          <>
            <p className="text-slate-300">
              You are signed in with Google. Soon you'll be able to save slips, follow people, and sync across devices.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-semibold py-2"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-300">
              Sign in to save your slips, track your performance, and join communities with your own profile.
            </p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? "Signing in..." : "Continue with Google"}
            </button>
          </>
        )}

        {authError && (
          <p className="text-[11px] text-rose-300">{authError}</p>
        )}
      </section>

      {/* Stats row (demo stats for now) */}
      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Win rate</p>
          <p className="text-base font-semibold text-emerald-300">
            {statsUser.winRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Slips created</p>
          <p className="text-base font-semibold text-slate-100">
            {statsUser.slipsCreated}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="text-[11px] text-slate-400 mb-1">Streak</p>
          <p className="text-base font-semibold text-amber-300">
            {statsUser.streakDays} days
          </p>
        </div>
      </section>

      {/* Placeholder for future activity */}
      <section className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
        <p className="text-xs font-semibold text-slate-200">
          Recent activity (coming soon)
        </p>
        <p className="text-[11px] text-slate-400">
          Soon you will see your last slips, bets, and community posts here, tied to your account.
        </p>
      </section>

      <MySlipsList />
    </main>
  );
}