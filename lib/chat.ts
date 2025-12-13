import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export function makeDmId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

export function subscribeToUserStatus(uid: string, callback: (status: { state: string; lastActive: Date }) => void) {
  const statusRef = doc(db, "userStatus", uid);
  return onSnapshot(statusRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        state: data.state,
        lastActive: data.lastActive.toDate(),
      });
    } else {
      callback({ state: "offline", lastActive: new Date(0) });
    }
  });
}

export function setUserOnline(uid: string, username: string) {
  const statusRef = doc(db, "userStatus", uid);
  setDoc(statusRef, {
    state: "online",
    lastActive: serverTimestamp(),
    username,
  });
}

export function setUserOfflineOnUnload(uid: string) {
  const statusRef = doc(db, "userStatus", uid);
  const handleUnload = () => {
    updateDoc(statusRef, {
      state: "offline",
      lastActive: serverTimestamp(),
    });
  };
  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}

export function setTypingForRoom(roomId: string, uid: string, username: string) {
  const typingRef = doc(db, "roomTyping", `${roomId}_${uid}`);
  setDoc(typingRef, {
    roomId,
    uid,
    username,
    updatedAt: serverTimestamp(),
  });
}

export function listenRoomTyping(roomId: string, callback: (users: string[]) => void) {
  const typingRef = collection(db, "roomTyping");
  const q = query(typingRef, where("roomId", "==", roomId));
  return onSnapshot(q, (snapshot) => {
    const now = Date.now();
    const typingUsers: string[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.updatedAt) {
        const updatedAt = data.updatedAt.toDate().getTime();
        if (now - updatedAt < 5000) { // 5 seconds
          typingUsers.push(data.username);
        }
      }
    });
    callback(typingUsers);
  });
}

export function setTypingForDm(chatId: string, uid: string, username: string) {
  const typingRef = doc(db, "dmTyping", `${chatId}_${uid}`);
  setDoc(typingRef, {
    chatId,
    uid,
    username,
    updatedAt: serverTimestamp(),
  });
}

export function listenDmTyping(chatId: string, callback: (users: string[]) => void) {
  const typingRef = collection(db, "dmTyping");
  const q = query(typingRef, where("chatId", "==", chatId));
  return onSnapshot(q, (snapshot) => {
    const now = Date.now();
    const typingUsers: string[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt.toDate().getTime();
      if (now - updatedAt < 5000) { // 5 seconds
        typingUsers.push(data.username);
      }
    });
    callback(typingUsers);
  });
}