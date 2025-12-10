"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import { setUserOnline, makeDmId } from "@/lib/chat";
import { useRouter } from "next/navigation";

type ChatRoom = {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: Date;
  messageCount: number;
  unread?: number;
  badge?: string;
  isHot?: boolean;
};

type DM = {
  id: string;
  otherUid: string;
  username: string;
  lastMessage: string;
  lastMessageAt: Date;
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [dms, setDms] = useState<DM[]>([]);
  const [activeTab, setActiveTab] = useState<"rooms" | "dms">("rooms");

  useEffect(() => {
    console.log("[DEBUG] ChatPage useEffect - user:", user);
    if (!user) {
      console.log("[DEBUG] No user, skipping subscriptions");
      return;
    }
    console.log("[DEBUG] User authenticated, setting up subscriptions");

    // Set user online
    setUserOnline(user.uid, user.displayName || "Anonymous");

    // Subscribe to rooms
    const q = query(collection(db, "chatRooms"), orderBy("lastMessageAt", "desc"));
    console.log("[DEBUG] Setting up rooms subscription");
    const unsubscribeRooms = onSnapshot(q, (querySnapshot) => {
      console.log("[DEBUG] Rooms snapshot received, docs count:", querySnapshot.size);
      const roomsData: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        roomsData.push({
          id: doc.id,
          name: data.name,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
          messageCount: data.messageCount,
          badge: data.badge,
          isHot: data.isHot,
        });
      });
      setRooms(roomsData);
    }, (error) => {
      console.error("[DEBUG] Rooms subscription error:", error);
    });

    // Subscribe to DMs
    const dmQ = query(collection(db, "directMessages"), where("users", "array-contains", user.uid));
    console.log("[DEBUG] Setting up DMs subscription");
    const unsubscribeDms = onSnapshot(dmQ, (querySnapshot) => {
      console.log("[DEBUG] DMs snapshot received, docs count:", querySnapshot.size);
      const dmsData: DM[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const otherUid = data.users.find((u: string) => u !== user.uid);
        dmsData.push({
          id: doc.id,
          otherUid,
          username: data.lastSenderId === user.uid ? "You" : "Other", // Placeholder, need to fetch username
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
        });
      });
      setDms(dmsData);
    }, (error) => {
      console.error("[DEBUG] DMs subscription error:", error);
    });

    return () => {
      console.log("[DEBUG] Cleaning up subscriptions");
      unsubscribeRooms();
      unsubscribeDms();
    };
  }, [user]);
  useEffect(() => {
    if (!user) return;
    // Set user online
    setUserOnline(user.uid, user.displayName || "Anonymous");

    // Subscribe to rooms
    const q = query(collection(db, "chatRooms"), orderBy("lastMessageAt", "desc"));
    const unsubscribeRooms = onSnapshot(q, (querySnapshot) => {
      const roomsData: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        roomsData.push({
          id: doc.id,
          name: data.name,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
          messageCount: data.messageCount,
          badge: data.badge,
          isHot: data.isHot,
        });
      });
      setRooms(roomsData);
    });

    // Subscribe to DMs
    const dmQ = query(collection(db, "directMessages"), where("users", "array-contains", user.uid));
    const unsubscribeDms = onSnapshot(dmQ, (querySnapshot) => {
      const dmsData: DM[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const otherUid = data.users.find((u: string) => u !== user.uid);
        dmsData.push({
          id: doc.id,
          otherUid,
          username: data.lastSenderId === user.uid ? "You" : "Other", // Placeholder, need to fetch username
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
        });
      });
      setDms(dmsData);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeDms();
    };
  }, [user]);

  const list = activeTab === "rooms" ? rooms : dms;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleRoomClick = (room: ChatRoom) => {
    router.push(`/chat/rooms/${room.id}`);
  };

  const handleDmClick = (dm: DM) => {
    router.push(`/chat/dm/${dm.otherUid}`);
  };

  return (
    <>
      <Header />
      <div className="p-4 space-y-4 text-sm">
        {/* Top summary / create */}
        <section className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#B5B5B5] uppercase tracking-[0.16em]">
              Chat
            </p>
            <p className="text-[12px] text-[#E5E5E5] mt-0.5">
              Talk slips, matches and ideas with others.
            </p>
          </div>
          <button className="text-[11px] px-3 py-1.5 rounded-full bg-[#111111] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[var(--forza-accent)] hover:border-[var(--forza-accent)] transition">
            New room
          </button>
        </section>

        {/* Tabs: Rooms / DMs */}
        <section className="rounded-full bg-[#050505] border border-[#1F1F1F] p-1 flex text-[11px]">
          <button
            className={`flex-1 rounded-full py-1.5 ${activeTab === "rooms" ? "bg-[#111111] text-white" : "text-[#888]"}`}
            onClick={() => setActiveTab("rooms")}
          >
            Rooms
          </button>
          <button
            className={`flex-1 rounded-full py-1.5 ${activeTab === "dms" ? "bg-[#111111] text-white" : "text-[#888]"}`}
            onClick={() => setActiveTab("dms")}
          >
            DMs
          </button>
        </section>

        {/* Conversations list */}
        <section className="space-y-2">
          {list.map((item) => {
            const isRoom = 'name' in item;
            const displayName = isRoom ? item.name : item.username;
            const time = isRoom ? formatTimeAgo(item.lastMessageAt) : formatTimeAgo(item.lastMessageAt);
            const avatarText = isRoom
              ? item.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              : item.username.slice(0, 2).toUpperCase();

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-[#111111] border border-[#1F1F1F] px-3 py-2.5 flex items-center gap-3 hover:bg-[#141414] transition-colors"
                onClick={() => isRoom ? handleRoomClick(item as ChatRoom) : handleDmClick(item as DM)}
              >
                {/* Avatar circle */}
                <div className="h-9 w-9 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[10px] text-[var(--forza-accent)] font-semibold">
                  {avatarText}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-[#E5E5E5] truncate">
                      {displayName}
                    </p>
                    <span className="text-[10px] text-[#777] shrink-0">
                      {time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888] truncate mt-0.5">
                    {item.lastMessage}
                  </p>
                </div>

                {/* Right side badges */}
                <div className="flex flex-col items-end gap-1 text-[10px]">
                  {isRoom && (item as ChatRoom).badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0B0B0B] border border-[var(--forza-accent)] text-[var(--forza-accent)]">
                      {(item as ChatRoom).badge}
                    </span>
                  )}
                  {isRoom && (item as ChatRoom).unread && (item as ChatRoom).unread! > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--forza-accent)] text-black flex items-center justify-center text-[10px] font-semibold">
                      {(item as ChatRoom).unread}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Small info note */}
        <section className="pb-4">
          <p className="text-[10px] text-[#777]">
            Real-time chat with Firestore. Join rooms and send messages.
          </p>
        </section>
      </div>
    </>
  );
}