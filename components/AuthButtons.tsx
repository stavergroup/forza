"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebaseClient";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleGoogleSignIn() {
    if (signingIn) return;
    try {
      setError(null);
      setSigningIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("[FORZA] Google sign-in error:", err);
      if (err.code !== 'auth/cancelled-popup-request') {
        setError("Sign-in failed. Check console for details.");
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      console.error("[FORZA] Sign-out error:", err);
      setError("Sign-out failed. Check console for details.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
        Checking auth...
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
      {user ? (
        <>
          <p className="text-slate-200">
            Logged in as <span className="font-semibold">{user.displayName || user.email}</span>
          </p>
          <p className="text-[11px] text-slate-400 break-all">
            UID: {user.uid}
          </p>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-semibold py-2"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="text-slate-200">
            You are not logged in.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-2 w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? "Signing in..." : "Continue with Google"}
          </button>
          <p className="text-[11px] text-slate-500 mt-1">
            This is only for development right now.
          </p>
        </>
      )}

      {error && (
        <p className="text-[11px] text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}