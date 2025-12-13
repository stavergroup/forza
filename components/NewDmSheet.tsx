"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthContext";
import { getOrCreateDmThread } from "@/lib/dm";

type UserRow = {
  uid: string;
  displayName?: string;
  handle?: string;
  photoURL?: string | null;
};

export default function NewDmSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [qText, setQText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserRow[]>([]);
  const term = useMemo(() => qText.trim().toLowerCase(), [qText]);

  useEffect(() => {
    if (!open) return;
    setQText("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!term) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Prefer "users" or "profiles" collection (use the one you already use in your app)
        const usersRef = collection(db, "users");

        // Prefix search on handleLower (recommended). If you don’t have it, use handle but ensure it’s stored in lowercase.
        const q = query(
          usersRef,
          orderBy("handleLower"),
          startAt(term),
          endAt(term + "\uf8ff"),
          limit(20)
        );

        const snap = await getDocs(q);
        const rows = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              uid: d.id,
              displayName: data.displayName || "FORZA user",
              handle: data.handle || "",
              photoURL: data.photoURL || null,
            } as UserRow;
          })
          .filter((u) => u.uid !== user?.uid);

        if (!cancelled) setResults(rows);
      } catch (e) {
        console.error("NewDmSheet search error:", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, term, user?.uid]);

  const startDm = async (other: UserRow) => {
    if (!user) return;

    const threadId = await getOrCreateDmThread(
      {
        uid: user.uid,
        displayName: user.displayName || profile?.displayName || "FORZA user",
        username: profile?.handle || "",
        photoURL: user.photoURL || profile?.photoURL || null,
      },
      {
        uid: other.uid,
        displayName: other.displayName || "FORZA user",
        username: other.handle || "",
        photoURL: other.photoURL || null,
      }
    );

    onClose();
    router.push(`/chat/dm/${threadId}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div className="w-full max-w-md rounded-t-3xl bg-[#050509] border-t border-zinc-800 px-4 pt-3 pb-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">New message</h2>
          <button onClick={onClose} className="text-xs text-zinc-400">
            Close
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 border border-zinc-800">
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Search handle…"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
          />
        </div>

        <div className="mt-3 max-h-[55vh] overflow-y-auto space-y-2">
          {loading && (
            <>
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
            </>
          )}

          {!loading && term && results.length === 0 && (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No users found.
            </p>
          )}

          {!loading &&
            results.map((u) => (
              <button
                key={u.uid}
                onClick={() => startDm(u)}
                className="w-full flex items-center gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-left"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                  {u.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {(u.displayName || "F")[0]}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-white font-medium">
                    {u.displayName || "FORZA user"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    @{u.handle || "forzauser"}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}