"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { collection, query, orderBy, startAt, endAt, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type SearchContext = "feed-users" | "matches" | "chat";

type SearchOverlayProps = {
  open: boolean;
  context: SearchContext;
  onClose: () => void;
};

type UserResult = {
  id: string;
  displayName: string;
  handle: string;
  photoURL?: string;
};

type MatchResult = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  leagueName?: string;
  kickoff?: any; // Timestamp
};

type ChatResult = {
  id: string;
  name: string;
  type: "dm" | "group";
  lastMessageSnippet?: string;
  memberCount?: number;
};

export default function SearchOverlay({ open, context, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<(UserResult | MatchResult | ChatResult)[]>([]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchTerm = debouncedQuery.toLowerCase().trim();
    setLoading(true);
    setError(null);

    const performSearch = async () => {
      try {
        if (context === "feed-users") {
          // Search users collection
          const q = query(
            collection(db, "users"),
            orderBy("handle"),
            startAt(searchTerm),
            endAt(searchTerm + "\uf8ff"),
            limit(10)
          );
          const snapshot = await getDocs(q);
          const users: UserResult[] = snapshot.docs.map(doc => ({
            id: doc.id,
            displayName: doc.data().displayName || "Unknown",
            handle: doc.data().handle || doc.id.slice(0, 6),
            photoURL: doc.data().photoURL,
          }));
          setResults(users);
        } else if (context === "matches") {
          // Search matches collection (assuming it exists)
          const q = query(
            collection(db, "matches"),
            orderBy("homeTeamName"),
            startAt(searchTerm),
            endAt(searchTerm + "\uf8ff"),
            limit(15)
          );
          const snapshot = await getDocs(q);
          const matches: MatchResult[] = snapshot.docs.map(doc => ({
            id: doc.id,
            homeTeamName: doc.data().homeTeamName || "",
            awayTeamName: doc.data().awayTeamName || "",
            leagueName: doc.data().leagueName,
            kickoff: doc.data().kickoff,
          }));
          setResults(matches);
        } else if (context === "chat") {
          // Search chatRooms and users for DMs
          const [roomsSnap, usersSnap] = await Promise.all([
            getDocs(query(collection(db, "chatRooms"), limit(10))),
            getDocs(query(collection(db, "users"), limit(10))),
          ]);

          const chats: ChatResult[] = [];

          // Rooms
          roomsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(searchTerm)) {
              chats.push({
                id: doc.id,
                name: data.name,
                type: "group",
                lastMessageSnippet: data.lastMessage,
                memberCount: data.messageCount || 0,
              });
            }
          });

          // Users for DMs
          usersSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.displayName?.toLowerCase().includes(searchTerm) || data.handle?.toLowerCase().includes(searchTerm)) {
              chats.push({
                id: doc.id,
                name: data.displayName || data.handle || "User",
                type: "dm",
                lastMessageSnippet: "",
              });
            }
          });

          setResults(chats.slice(0, 10));
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, context]);

  const title = useMemo(() => {
    switch (context) {
      case "feed-users": return "Search users";
      case "matches": return "Search matches & teams";
      case "chat": return "Search chats, groups & users";
    }
  }, [context]);

  const placeholder = useMemo(() => {
    switch (context) {
      case "feed-users": return "Search bettors, tipsters…";
      case "matches": return "Search teams or fixtures…";
      case "chat": return "Search DM, groups, communities…";
    }
  }, [context]);

  const handleResultClick = (result: UserResult | MatchResult | ChatResult) => {
    onClose();
    if (context === "feed-users") {
      router.push(`/u/${(result as UserResult).handle}`);
    } else if (context === "matches") {
      router.push(`/matches/${result.id}`);
    } else if (context === "chat") {
      // Assuming chat routing
      router.push(`/chat?${(result as ChatResult).type === "dm" ? "conversationId" : "groupId"}=${result.id}`);
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#050509] border-t border-zinc-800 px-4 pt-3 pb-6 transition-transform ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-zinc-600 rounded-full mx-auto mb-4" />

        {/* Title */}
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">{title}</h2>

        {/* Search input */}
        <div className="flex items-center gap-3 mb-4">
          <Search size={20} className="text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-zinc-900 rounded-full px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
          <button onClick={onClose} className="text-zinc-500 text-sm">
            Cancel
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {loading && debouncedQuery && (
            // Skeleton placeholders
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-900/60 px-3 py-2 animate-pulse">
                <div className="h-4 bg-zinc-700 rounded mb-1" />
                <div className="h-3 bg-zinc-800 rounded" />
              </div>
            ))
          )}

          {!loading && !debouncedQuery && (
            <p className="text-zinc-500 text-sm text-center py-4">
              Try searching for Arsenal or a friend's username
            </p>
          )}

          {!loading && debouncedQuery && results.length === 0 && !error && (
            <p className="text-zinc-500 text-sm text-center py-4">No results found</p>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center py-4">{error}</p>
          )}

          {results.map((result, index) => (
            <div
              key={result.id || index}
              className="rounded-2xl bg-zinc-900/60 px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-zinc-800/60 transition"
              onClick={() => handleResultClick(result)}
            >
              {context === "feed-users" && (
                <>
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                    {(result as UserResult).displayName[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-100 font-medium">{(result as UserResult).displayName}</p>
                    <p className="text-zinc-500 text-sm">@{ (result as UserResult).handle}</p>
                  </div>
                </>
              )}

              {context === "matches" && (
                <>
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                    ⚽
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-100">{(result as MatchResult).homeTeamName} vs {(result as MatchResult).awayTeamName}</p>
                    <p className="text-zinc-500 text-sm">{(result as MatchResult).leagueName}</p>
                  </div>
                  <span className="text-zinc-400 text-sm">View</span>
                </>
              )}

              {context === "chat" && (
                <>
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                    {(result as ChatResult).type === "dm" ? "💬" : "👥"}
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-100">{(result as ChatResult).name}</p>
                    <p className="text-zinc-500 text-sm">
                      {(result as ChatResult).type === "dm" ? (result as ChatResult).lastMessageSnippet : `${(result as ChatResult).memberCount} members`}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}