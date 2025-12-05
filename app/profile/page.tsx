"use client";

import Header from "@/components/Header";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "FORZA User");
  const handle = user?.email ? `@${user.email.split("@")[0]}` : "@forza-user";
  const joined = "Joined FORZA";

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (err) {
      console.error("[FORZA] Logout error", err);
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 space-y-4 text-sm">
        {/* Top profile card */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[13px] text-[#A4FF2F] font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-[#E5E5E5] font-semibold">
                {displayName}
              </p>
              <p className="text-[11px] text-[#888]">{handle}</p>
              <p className="text-[10px] text-[#555] mt-0.5">{joined}</p>
            </div>
            <button className="text-[11px] px-3 py-1.5 rounded-full bg-[#111111] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[#A4FF2F] hover:border-[#A4FF2F] transition">
              Edit
            </button>
          </div>
        </section>

        {/* Stats row: Followers / Following / Saved slips (mock numbers for now) */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3 flex items-center justify-between text-[11px]">
          <div className="flex-1 text-center">
            <p className="text-[13px] text-[#E5E5E5] font-semibold">0</p>
            <p className="text-[#888] mt-0.5">Followers</p>
          </div>
          <div className="w-px h-8 bg-[#1F1F1F]" />
          <div className="flex-1 text-center">
            <p className="text-[13px] text-[#E5E5E5] font-semibold">0</p>
            <p className="text-[#888] mt-0.5">Following</p>
          </div>
          <div className="w-px h-8 bg-[#1F1F1F]" />
          <div className="flex-1 text-center">
            <p className="text-[13px] text-[#E5E5E5] font-semibold">0</p>
            <p className="text-[#888] mt-0.5">Saved slips</p>
          </div>
        </section>

        {/* Betting Progress (still mock) */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-3">
          <p className="text-[11px] text-[#B5B5B5] uppercase tracking-[0.16em]">
            Betting Progress
          </p>
          <div className="flex items-center justify-between text-[12px]">
            <div>
              <p className="text-[#E5E5E5] font-semibold">0%</p>
              <p className="text-[11px] text-[#888]">Win rate</p>
            </div>
            <div>
              <p className="text-[#E5E5E5] font-semibold">0</p>
              <p className="text-[11px] text-[#888]">Wins</p>
            </div>
            <div>
              <p className="text-[#E5E5E5] font-semibold">0</p>
              <p className="text-[11px] text-[#888]">Losses</p>
            </div>
          </div>

          <div className="h-2 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
            <div className="h-full bg-[#A4FF2F]" style={{ width: "0%" }} />
          </div>

          <p className="text-[10px] text-[#777]">
            Stats will be updated once slips and results are connected.
          </p>
        </section>

        {/* My activity */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-2">
          <p className="text-[11px] text-[#B5B5B5] uppercase tracking-[0.16em]">
            My activity
          </p>
          <div className="space-y-1.5 text-[12px]">
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">My slips</span>
              <span className="text-[11px] text-[#777]">View all</span>
            </button>
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">Followed matches</span>
              <span className="text-[11px] text-[#777]">Open list</span>
            </button>
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">Chat & rooms</span>
              <span className="text-[11px] text-[#777]">Activity</span>
            </button>
          </div>
        </section>

        {/* Settings */}
        <section className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-3.5 space-y-2">
          <p className="text-[11px] text-[#B5B5B5] uppercase tracking-[0.16em]">
            Settings
          </p>
          <div className="space-y-1.5 text-[12px]">
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">Theme</span>
              <span className="text-[11px] text-[#777]">Dark · Lime</span>
            </button>
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">Notifications</span>
              <span className="text-[11px] text-[#777]">Coming soon</span>
            </button>
            <button className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[#151515] transition">
              <span className="text-[#E5E5E5]">Account</span>
              <span className="text-[11px] text-[#777]">
                {user?.email || "Email / login"}
              </span>
            </button>
          </div>
        </section>

        {/* Auth / logout */}
        <section className="pb-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-[#111111] border border-[#1F1F1F] text-[12px] text-[#FF6666] font-medium py-2.5 hover:bg-[#151515] active:scale-[0.97] transition"
          >
            Log out
          </button>
          <p className="text-[10px] text-[#777] text-center mt-1.5">
            You are logged in as {user?.email || "unknown user"}.
          </p>
        </section>
      </div>
    </>
  );
}