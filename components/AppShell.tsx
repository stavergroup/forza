"use client";

import {
  ReactNode,
  useEffect,
  useState,
  FormEvent,
} from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

type AuthMode = "signin" | "signup";

export default function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  async function handleGoogleSignIn() {
    try {
      setErrorMsg(null);
      setGoogleLoading(true);
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("[FORZA] Google sign-in error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Popup closed. Try again.");
      } else {
        setErrorMsg("Google sign-in failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setErrorMsg(null);
      setEmailLoading(true);

      if (!email || !password) {
        setErrorMsg("Email and password are required.");
        return;
      }

      if (authMode === "signup") {
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters.");
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("[FORZA] Email auth error:", err);
      const code = err?.code || "";

      if (code === "auth/user-not-found") {
        setErrorMsg("No account found with that email.");
      } else if (code === "auth/wrong-password") {
        setErrorMsg("Incorrect password.");
      } else if (code === "auth/email-already-in-use") {
        setErrorMsg("This email is already used.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("Invalid email format.");
      } else {
        setErrorMsg("Authentication failed.");
      }
    } finally {
      setEmailLoading(false);
    }
  }

  // Checking existing session
  if (checking) {
    return (
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-400">Checking session…</p>
          </div>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN → show auth screen
  if (!user) {
    return (
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
          <div className="flex-1 flex items-center justify-center px-4">
            <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 text-xs shadow-[0_18px_50px_rgba(0,0,0,0.7)]">
              
              {/* Title */}
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
                  Welcome to FORZA
                </p>
                <h1 className="text-lg font-semibold text-slate-100">
                  Sign in to continue
                </h1>
                <p className="text-[11px] text-slate-400">
                  Use email & password or Google to access FORZA.
                </p>
              </div>

              {/* Sign in / Create account toggle */}
              <div className="inline-flex rounded-full bg-slate-900 border border-slate-700 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`px-3 py-1 rounded-full ${
                    authMode === "signin"
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`px-3 py-1 rounded-full ${
                    authMode === "signup"
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400"
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* Email/password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Password</label>
                  <input
                    type="password"
                    autoComplete={
                      authMode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100"
                    placeholder="At least 6 characters"
                  />
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100"
                      placeholder="Repeat your password"
                    />
                  </div>
                )}

                {errorMsg && (
                  <p className="text-[11px] text-rose-300">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full rounded-xl bg-slate-800 text-slate-50 font-semibold py-2 text-xs disabled:opacity-60"
                >
                  {emailLoading
                    ? authMode === "signin"
                      ? "Signing in…"
                      : "Creating…"
                    : authMode === "signin"
                    ? "Sign in with email"
                    : "Create account"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[10px] text-slate-500">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Google</span>
                {googleLoading && <span className="text-[10px]">…</span>}
              </button>

            </section>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN → full app
  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-md flex flex-col bg-slate-950/70 border-x border-slate-800/80">
        <div className="flex-1 pb-16 pt-1">
          <Header />
          <div className="px-4">{children}</div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}