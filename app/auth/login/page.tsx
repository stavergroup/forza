"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/feed");
    } catch (err: any) {
      console.error("[FORZA] Login error", err);
      setError(err?.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace("/feed");
    } catch (err: any) {
      console.error("[FORZA] Google login error", err);
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-4 pb-20 bg-[#0A0A0A]">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-11 w-11 rounded-2xl bg-[#111111] border border-[#1F1F1F] flex items-center justify-center text-[var(--forza-accent)] font-bold text-[14px]">
            FZ
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-[18px] font-semibold text-[#E5E5E5]">
              Log in to FORZA
            </h1>
            <p className="text-[12px] text-[#888888]">
              Continue to follow matches, slips and chats.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleEmailLogin}
          className="space-y-3 rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">Email</label>
            <input
              type="email"
              className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[13px] text-[#E5E5E5] placeholder:text-[#555] outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">Password</label>
            <input
              type="password"
              className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[13px] text-[#E5E5E5] placeholder:text-[#555] outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-[11px] text-[#FF6666] mt-1">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#888]">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border border-[#555] bg-transparent"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="text-[#B5B5B5] hover:text-[var(--forza-accent)] transition"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 rounded-xl bg-[var(--forza-accent)] text-black text-[13px] font-semibold py-2.5 hover:brightness-95 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>

          <div className="flex items-center gap-2 text-[10px] text-[#777] pt-1">
            <div className="flex-1 h-px bg-[#1F1F1F]" />
            <span>or</span>
            <div className="flex-1 h-px bg-[#1F1F1F]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] text-[12px] text-[#E5E5E5] py-2.5 hover:bg-[#151515] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <span className="text-[14px]">G</span>
            <span>Continue with Google</span>
          </button>
        </form>

        {/* Bottom link */}
        <p className="text-[11px] text-[#888888] text-center">
          Don't have an account?{" "}
          <a
            href="/auth/register"
            className="text-[var(--forza-accent)] font-medium hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}