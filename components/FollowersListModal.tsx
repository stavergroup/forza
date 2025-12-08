"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
  getDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface FollowersListModalProps {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

interface FollowWithUser {
  id: string;
  userId: string;
  displayName: string;
  username?: string;
  photoURL?: string | null;
}

export default function FollowersListModal({
  userId,
  type,
  onClose,
}: FollowersListModalProps) {
  const [items, setItems] = useState<FollowWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const followsCol = collection(db, "follows");

    const q =
      type === "followers"
        ? query(followsCol, where("followingId", "==", userId))
        : query(followsCol, where("followerId", "==", userId));

    const unsub = onSnapshot(q, async (snap) => {
      const rows: FollowWithUser[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data() as DocumentData;
        const otherUserId =
          type === "followers" ? data.followerId : data.followingId;

        const userDoc = await getDoc(doc(db, "users", otherUserId));
        const userData = userDoc.data() || {};

        rows.push({
          id: docSnap.id,
          userId: otherUserId,
          displayName: userData.displayName || "FORZA user",
          username: userData.handle || "",
          photoURL: userData.photoURL || null,
        });
      }

      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [userId, type]);

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-md bg-[#050607] rounded-t-3xl sm:rounded-3xl border border-[#1f262f] max-h-[80vh] flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f262f]">
          <div className="w-8" />
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-xs text-[#98A2B3] hover:text-white"
          >
            Close
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading && (
            <p className="text-xs text-[#98A2B3] py-4">Loading...</p>
          )}

          {!loading && items.length === 0 && (
            <p className="text-xs text-[#98A2B3] py-4">No users yet.</p>
          )}

          {!loading &&
            items.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onClose();
                  router.push(`/u/${u.userId}`);
                }}
                className="w-full flex items-center gap-3 py-2"
              >
                <div className="h-9 w-9 rounded-full bg-[#1f262f] flex items-center justify-center text-xs font-semibold">
                  {u.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span>{u.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm">{u.displayName}</span>
                  {u.username && (
                    <span className="text-xs text-[#98A2B3]">
                      @{u.username}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}