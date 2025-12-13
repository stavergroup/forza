import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type UserInfo = {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string | null;
};

export async function getOrCreateDmThread(user1: UserInfo, user2: UserInfo): Promise<string> {
  const ids = [user1.uid, user2.uid].sort();
  const threadId = ids.join('_');

  const threadRef = doc(db, 'dmThreads', threadId);
  const snap = await getDoc(threadRef);

  if (!snap.exists()) {
    await setDoc(threadRef, {
      participantIds: ids,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      otherUserNameMap: {
        [user1.uid]: user2.displayName ?? user2.username ?? 'FORZA user',
        [user2.uid]: user1.displayName ?? user1.username ?? 'FORZA user',
      },
      otherUserAvatarMap: {
        [user1.uid]: user2.photoURL ?? null,
        [user2.uid]: user1.photoURL ?? null,
      },
    });
  }

  return threadId;
}