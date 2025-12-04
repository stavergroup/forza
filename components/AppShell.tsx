"use client";

import { ReactNode, useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    try {
      setAuthError(null);
      setSigningIn(true);
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("[FORZA] Global sign-in error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setAuthError("Popup closed. Try again.");
      } else {
        setAuthError("Could not sign in. Check popup or network.");
      }
    } finally {
      setSigningIn(false);
    }
  }

  // While checking auth, show a simple loader in the shell
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-400">Checking your FORZA session…</p>
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show full-screen sign-in view (no access to app yet)
  if (!user) {
    return (
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
          <div className="flex-1 flex items-center justify-center px-4">
            <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 text-xs shadow-[0_18px_50px_rgba(0,0,0,0.7)]">
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
                Welcome to FORZA
              </p>
              <h1 className="text-lg font-semibold text-slate-100">
                Sign in to enter the hub
              </h1>
              <p className="text-[11px] text-slate-400">
                FORZA uses your Google account to keep your slips, community posts and
                preferences in sync. You need to sign in to use the app.
              </p>

              {authError && (
                <p className="text-[11px] text-rose-300">{authError}</p>
              )}

              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="mt-1 w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Continue with Google</span>
                {signingIn && <span className="text-[10px]">...</span>}
              </button>

              <p className="text-[10px] text-slate-500 mt-2">
                We only use your basic Google profile (name & email) to create your
                FORZA account. You can sign out from your profile anytime.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Signed-in state: show full app (header + content + bottom nav)
  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
        <div className="flex-1 pb-16 pt-1">
          <Header />
          <div className="px-4">
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}