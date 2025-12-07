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
  limit,
} from "firebase/firestore";
import { X } from "@phosphor-icons/react";

type CommentDoc = {
  id: string;
  slipId: string;
  userId: string;
  text: string;
  createdAt: any;
  userDisplayName?: string;
  userAvatar?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    setIsInitialLoading(true);

    // Temporarily simplify query to test if collection exists
    const q = query(
      collection(db, "slipComments"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    console.log("Setting up comments query for slipId:", slipId, "- querying all comments temporarily");

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log("Comments snapshot received:", snapshot.docs.length, "docs");
        const commentDocs: CommentDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            slipId: data.slipId,
            userId: data.userId,
            text: data.text,
            createdAt: data.createdAt,
            userDisplayName: data.userDisplayName,
            userAvatar: data.userAvatar,
          };
        });

        // Filter out any pending comment that's now in Firestore
        const filteredComments = commentDocs.filter((c) => c.id !== pendingCommentId);

        setComments((prev) => {
          // Keep any optimistic pending comment that still has id === pendingCommentId
          const pending = prev.find((c) => c.id === pendingCommentId && !filteredComments.some(fc => fc.id === pendingCommentId));
          return pending ? [pending, ...filteredComments] : filteredComments;
        });

        setLoading(false);
        setIsInitialLoading(false);
      },
      (error) => {
        console.error("Comments query error:", error);
        setLoading(false);
        setIsInitialLoading(false);
        setComments([]);
      }
    );

    // Fallback timeout in case onSnapshot never fires
    const timeout = setTimeout(() => {
      setLoading(false);
      setIsInitialLoading(false);
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [slipId, pendingCommentId]);

  const handleSubmitComment = async () => {
    if (!currentUser || !commentText.trim() || isPosting) return;

    const text = commentText.trim();
    setIsPosting(true);

    // Create a temporary local id
    const tempId = `pending-${Date.now()}`;

    // Add optimistic comment to state
    const optimisticComment: CommentDoc = {
      id: tempId,
      slipId,
      userId: currentUser.uid,
      text,
      userDisplayName: currentUser.displayName || "FORZA user",
      userAvatar: currentUser.photoURL || null,
      createdAt: null, // means "pending"
    };

    setComments(prev => [optimisticComment, ...prev]);
    setPendingCommentId(tempId);
    setCommentText("");

    try {
      // Write to Firestore
      await addDoc(collection(db, "slipComments"), {
        slipId,
        userId: currentUser.uid,
        text,
        userDisplayName: currentUser.displayName || "FORZA user",
        userAvatar: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "slips", slipId), {
        commentsCount: increment(1),
      });

      setPendingCommentId(null);
    } catch {
      // Remove optimistic comment on failure
      setComments(prev => prev.filter(c => c.id !== tempId));
      setPendingCommentId(null);
      // TODO: optional toast/snackbar
    } finally {
      setIsPosting(false);
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
          {isInitialLoading ? (
            // Skeleton loading state
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="h-9 w-9 rounded-full bg-zinc-800/80 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded-full bg-zinc-800/80 animate-pulse" />
                    <div className="h-4 w-3/4 rounded-full bg-zinc-800/80 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-slate-500 text-sm">
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const displayName = comment.userDisplayName || "FORZA user";
              const photo = comment.userAvatar;
              const avatarLabel = (displayName || "FORZA user").charAt(0).toUpperCase();
              const isPending = !comment.createdAt;
              const timeAgo = isPending ? "Posting..." : timeAgoFromTimestamp(comment.createdAt);

              return (
                <div key={comment.id} className={`flex gap-3 items-start ${isPending ? "opacity-70" : ""}`}>
                  {photo ? (
                    <img
                      src={photo}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-teal-500/80 flex items-center justify-center text-xs font-semibold text-black flex-shrink-0">
                      {avatarLabel}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {displayName}
                      </span>
                      <span className={`text-xs flex-shrink-0 ${isPending ? "text-slate-500" : "text-slate-400"}`}>
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
            disabled={isPosting || !commentText.trim() || !currentUser}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#a4ff2f] text-black disabled:opacity-40"
          >
            {isPosting ? "..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render above BottomNav
  return typeof window === "undefined" ? null : createPortal(sheet, document.body);
}