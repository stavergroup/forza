"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      router.replace("/feed");
    } catch (err: any) {
      console.error("[FORZA] Register error", err);
      setError(err?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace("/feed");
    } catch (err: any) {
      console.error("[FORZA] Google signup error", err);
      setError(err?.message || "Google sign-up failed.");
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
              Create your FORZA account
            </h1>
            <p className="text-[12px] text-[#888888]">
              Save slips, follow matches and join chats.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleRegister}
          className="space-y-3 rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">Name</label>
            <input
              type="text"
              className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[13px] text-[#E5E5E5] placeholder:text-[#555] outline-none"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-[#B5B5B5]">
              Confirm password
            </label>
            <input
              type="password"
              className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] px-3 py-2 text-[13px] text-[#E5E5E5] placeholder:text-[#555] outline-none"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-[11px] text-[#FF6666] mt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 rounded-xl bg-[var(--forza-accent)] text-black text-[13px] font-semibold py-2.5 hover:brightness-95 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <div className="flex items-center gap-2 text-[10px] text-[#777] pt-1">
            <div className="flex-1 h-px bg-[#1F1F1F]" />
            <span>or</span>
            <div className="flex-1 h-px bg-[#1F1F1F]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full rounded-xl bg-[#0B0B0B] border border-[#1F1F1F] text-[12px] text-[#E5E5E5] py-2.5 hover:bg-[#151515] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <span className="text-[14px]">G</span>
            <span>Sign up with Google</span>
          </button>
        </form>

        {/* Bottom link */}
        <p className="text-[11px] text-[#888888] text-center">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="text-[var(--forza-accent)] font-medium hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}