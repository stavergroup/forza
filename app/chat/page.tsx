// KILO PROMPT – app/chat/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/components/AuthContext';
import { ChatDots, UsersThree } from '@phosphor-icons/react';

type Room = {
  id: string;
  name: string;
  createdBy: string;
  lastMessage?: string;
  lastMessageAt?: Date;
};

type DMThread = {
  id: string;
  participantIds: string[];
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'dms' ? 'dms' : 'rooms';

  const [activeTab, setActiveTab] = useState<'rooms' | 'dms'>(initialTab);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dmThreads, setDmThreads] = useState<DMThread[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingDMs, setLoadingDMs] = useState(true);

  // keep URL in sync with tab
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', activeTab);
    router.replace(`/chat?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Subscribe to rooms
  useEffect(() => {
    if (!user) return;

    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('lastMessageAt', 'desc'));

    const unsub = onSnapshot(q, snapshot => {
      const next: Room[] = snapshot.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? 'Room',
          createdBy: data.createdBy,
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: data.lastMessageAt?.toDate?.() ?? undefined,
        };
      });
      setRooms(next);
      setLoadingRooms(false);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const threadsRef = collection(db, 'dmThreads');

    // Only filter by participantIds – no orderBy here, so no index needed
    const q = query(threadsRef, where('participantIds', 'array-contains', user.uid));

    const unsub = onSnapshot(q, snapshot => {
      const raw: DMThread[] = snapshot.docs.map(d => {
        const data = d.data() as any;
        const participantIds = (data.participantIds || []) as string[];

        const otherUserId = participantIds.find((id: string) => id !== user.uid);

        return {
          id: d.id,
          participantIds,
          otherUserName:
            (otherUserId && data.otherUserNameMap?.[otherUserId]) ??
            'FORZA user',
          otherUserAvatar: otherUserId ? data.otherUserAvatarMap?.[otherUserId] : undefined,
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: data.lastMessageAt?.toDate?.() ?? undefined,
        };
      });

      // Sort in memory by lastMessageAt desc so UI still looks nice
      const sorted = raw.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() ?? 0;
        const bTime = b.lastMessageAt?.getTime() ?? 0;
        return bTime - aTime;
      });

      setDmThreads(sorted);
      setLoadingDMs(false);
    });

    return () => unsub();
  }, [user]);

  const handleCreateRoom = async () => {
    if (!user) return;
    const name = window.prompt('Room name');
    if (!name) return;

    const roomsRef = collection(db, 'rooms');

    const payload = {
      name: name.trim(),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    };

    const docRef = await addDoc(roomsRef, payload);
    router.push(`/chat/rooms/${docRef.id}`);
  };

  const emptyStateText = useMemo(() => {
    if (activeTab === 'rooms') {
      return loadingRooms ? 'Loading rooms…' : 'No rooms yet. Create the first one.';
    }
    return loadingDMs ? 'Loading conversations…' : 'No conversations yet.';
  }, [activeTab, loadingRooms, loadingDMs]);

  return (
    <div className="flex flex-col h-full">
      {/* Header stays same style as other pages */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/80">
        <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase mb-1">Chat</p>
        <p className="text-sm text-zinc-200">
          Talk slips, matches and ideas with others.
        </p>
      </div>

      {/* Tabs + New room button row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <div className="flex w-full max-w-[260px] rounded-full bg-zinc-900 p-1 text-xs font-medium">
          <button
            className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-1 ${
              activeTab === 'rooms'
                ? 'bg-zinc-100 text-black'
                : 'text-zinc-400'
            }`}
            onClick={() => setActiveTab('rooms')}
          >
            <UsersThree size={16} weight={activeTab === 'rooms' ? 'fill' : 'regular'} />
            <span>Rooms</span>
          </button>
          <button
            className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-1 ${
              activeTab === 'dms'
                ? 'bg-zinc-100 text-black'
                : 'text-zinc-400'
            }`}
            onClick={() => setActiveTab('dms')}
          >
            <ChatDots size={16} weight={activeTab === 'dms' ? 'fill' : 'regular'} />
            <span>DMs</span>
          </button>
        </div>

        {activeTab === 'rooms' && (
          <button
            onClick={handleCreateRoom}
            className="ml-3 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
          >
            New room
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'rooms' ? (
          rooms.length === 0 ? (
            <p className="mt-6 text-center text-xs text-zinc-500">{emptyStateText}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/chat/rooms/${room.id}`)}
                  className="w-full rounded-3xl bg-zinc-900 px-4 py-3 text-left border border-zinc-800 active:bg-zinc-800/80"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-50">{room.name}</p>
                    <span className="ml-2 rounded-full bg-lime-400/10 text-[11px] px-2 py-0.5 text-lime-400">
                      Room
                    </span>
                  </div>
                  {room.lastMessage && (
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">
                      {room.lastMessage}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )
        ) : dmThreads.length === 0 ? (
          <p className="mt-6 text-center text-xs text-zinc-500">{emptyStateText}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {dmThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => router.push(`/chat/dm/${thread.id}`)}
                className="w-full rounded-3xl bg-zinc-900 px-4 py-3 text-left border border-zinc-800 active:bg-zinc-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-100">
                      {thread.otherUserName?.[0]?.toUpperCase() ?? 'F'}
                    </div>
                    <p className="text-sm text-zinc-50">{thread.otherUserName}</p>
                  </div>
                  <span className="ml-2 rounded-full bg-zinc-100/5 text-[11px] px-2 py-0.5 text-zinc-300">
                    DM
                  </span>
                </div>
                {thread.lastMessage && (
                  <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">
                    {thread.lastMessage}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}