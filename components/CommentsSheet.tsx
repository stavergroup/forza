"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { X } from "@phosphor-icons/react";

type CommentDoc = {
  id: string;
  slipId: string;
  userId: string;
  text: string;
  createdAt: any;
  user?: {
    displayName?: string;
    handle?: string;
    photoURL?: string;
    avatarColor?: string;
  };
};

function timeAgoFromTimestamp(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

function initialsFromName(name?: string) {
  if (!name) return "FZ";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[1].charAt(0).toUpperCase()
  );
}

export default function CommentsSheet({
  slipId,
  onClose,
}: {
  slipId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, "slipComments"),
      where("slipId", "==", slipId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const commentDocs: CommentDoc[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as any;
        let userProfile = undefined;

        try {
          const userSnap = await import("firebase/firestore").then(({ getDoc }) =>
            getDoc(doc(db, "users", data.userId))
          );
          if (userSnap.exists()) {
            userProfile = userSnap.data();
          }
        } catch {
          // Silent fail
        }

        commentDocs.push({
          id: docSnap.id,
          slipId: data.slipId,
          userId: data.userId,
          text: data.text,
          createdAt: data.createdAt,
          user: userProfile,
        });
      }

      setComments(commentDocs);
    });

    return () => unsub();
  }, [slipId]);

  const handleSubmitComment = async () => {
    if (!currentUser || !commentText.trim()) return;

    try {
      setSending(true);
      const text = commentText.trim();

      await addDoc(collection(db, "slipComments"), {
        slipId,
        userId: currentUser.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "slips", slipId), {
        commentsCount: increment(1),
      });

      setCommentText("");
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  };

  // Current user avatar for input row
  const currentUserPhoto = currentUser?.photoURL;
  const currentUserDisplayName = currentUser?.displayName || "FORZA user";
  const currentUserAvatarColor = "#333"; // Could be loaded from user profile
  const currentUserAvatarLabel = initialsFromName(currentUserDisplayName);

  // Portal implementation for full-screen overlay above BottomNav
  const sheet = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70">
      <div className="w-full max-w-xl h-[85vh] bg-[#050505] rounded-t-3xl flex flex-col overflow-hidden">
        {/* Header with grab handle */}
        <div className="pt-3 pb-2 px-4 border-b border-white/5">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/10" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Comments</h2>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-slate-500 text-sm">
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const displayName = comment.user?.displayName || "FORZA user";
              const photo = comment.user?.photoURL;
              const avatarColor = comment.user?.avatarColor || "#374151";
              const avatarLabel = initialsFromName(displayName);
              const timeAgo = timeAgoFromTimestamp(comment.createdAt);

              return (
                <div key={comment.id} className="flex gap-3">
                  {photo ? (
                    <img
                      src={photo}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor, color: "#ffffff" }}
                    >
                      {avatarLabel}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Input Row */}
        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2 pb-4">
          {/* Current User Avatar */}
          {currentUserPhoto ? (
            <img
              src={currentUserPhoto}
              alt="your avatar"
              className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {currentUserAvatarLabel}
            </div>
          )}

          {/* Input */}
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Join the conversation…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />

          {/* Post Button */}
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || sending || !currentUser}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#a4ff2f] text-black disabled:opacity-40"
          >
            {sending ? "..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render above BottomNav
  return typeof window === "undefined" ? null : createPortal(sheet, document.body);
}