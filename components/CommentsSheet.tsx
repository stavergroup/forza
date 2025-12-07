"use client";

import { useEffect, useState } from "react";
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
import { X, Minus } from "@phosphor-icons/react";

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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div className="w-full max-w-md bg-[#101010] rounded-t-3xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b border-[#333]">
          <div className="w-12 h-1 bg-[#555] rounded-full" />
          <h2 className="absolute text-[16px] font-semibold text-white">
            Comments
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-1"
          >
            <X size={20} className="text-[#888]" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-[#888] text-[14px]">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => {
              const displayName = comment.user?.displayName || "FORZA user";
              const handle = comment.user?.handle ? `@${comment.user.handle}` : "";
              const photo = comment.user?.photoURL;
              const avatarColor = comment.user?.avatarColor || "#333";
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
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor, color: "#ffffff" }}
                    >
                      {avatarLabel}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-medium text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-[#888] flex-shrink-0">
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#E4E4E4] leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Row */}
        <div className="p-4 border-t border-[#333] bg-[#101010]">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the conversation…"
              className="flex-1 rounded-full bg-[#1A1A1A] border border-[#444] px-4 py-2.5 text-[14px] text-white placeholder-[#888] outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={sending || !commentText.trim() || !currentUser}
              className="px-4 py-2.5 rounded-full bg-[#a4ff2f] text-[14px] font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}