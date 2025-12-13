"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import { listenRoomTyping, setTypingForRoom } from "@/lib/chat";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  createdAt: Date;
};

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(db, "rooms", roomId as string);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoom({ id: doc.id, ...doc.data() });
      } else {
        setRoom(null);
      }
    });
    return unsubscribe;
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user) return;
    const messagesRef = collection(db, "rooms", roomId as string, "messages");
    const q = query(messagesRef, orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          avatar: data.avatarUrl || "",
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      setMessages(messagesData);
    });
    return unsubscribe;
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenRoomTyping(roomId as string, (users) => {
      setTypingUsers(users.filter(u => u !== user?.displayName));
    });
    return unsubscribe;
  }, [roomId, user]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !roomId) return;
    const messagesRef = collection(db, "rooms", roomId as string, "messages");
    await addDoc(messagesRef, {
      senderId: user.uid,
      senderName: user.displayName || "Anonymous",
      avatarUrl: user.photoURL || "",
      text: input,
      createdAt: serverTimestamp(),
    });
    const roomRef = doc(db, "rooms", roomId as string);
    await updateDoc(roomRef, {
      lastMessage: input,
      lastMessageAt: serverTimestamp(),
      messageCount: increment(1),
    });
    setInput("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!room) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="p-4 space-y-4 text-sm">
        {/* Room header */}
        <section className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[10px] text-[var(--forza-accent)] font-semibold">
            {room.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-[12px] text-[#E5E5E5]">{room.name}</p>
            <p className="text-[10px] text-[#777]">{room.messageCount || 0} messages</p>
          </div>
        </section>

        {/* Messages */}
        <section className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <article key={message.id} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[8px] text-[var(--forza-accent)] font-semibold">
                {message.avatar ? (
                  <img src={message.avatar} alt={message.senderName} className="h-full w-full rounded-full" />
                ) : (
                  message.senderName[0].toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-[#E5E5E5] font-semibold">{message.senderName}</p>
                  <span className="text-[9px] text-[#777]">{formatTime(message.createdAt)}</span>
                </div>
                <p className="text-[11px] text-[#888] mt-0.5">{message.text}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <section className="text-[10px] text-[#777] animate-pulse">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people are typing...`}
          </section>
        )}

        {/* Input */}
        <section className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Debounced typing indicator
              const timeoutId = setTimeout(() => {
                if (user && roomId) {
                  setTypingForRoom(roomId as string, user.uid, user.displayName || "Anonymous");
                }
              }, 1000);
              return () => clearTimeout(timeoutId);
            }}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-full bg-[#111111] border border-[#1F1F1F] text-[11px] text-[#E5E5E5] placeholder-[#777] focus:outline-none focus:border-[var(--forza-accent)]"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-full bg-[var(--forza-accent)] text-black text-[11px] font-semibold hover:bg-opacity-80 transition"
          >
            Send
          </button>
        </section>
      </div>
    </>
  );
}