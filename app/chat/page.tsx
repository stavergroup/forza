import Header from "@/components/Header";

type ChatRoom = {
  id: number;
  name: string;
  type: "room" | "dm";
  lastMessage: string;
  time: string;
  unread?: number;
  badge?: string;
};

const demoRooms: ChatRoom[] = [
  {
    id: 1,
    name: "FORZA Global Chat",
    type: "room",
    lastMessage: "SlipMaster: I hit a 5x combo today 🔥",
    time: "2m",
    unread: 12,
    badge: "Hot",
  },
  {
    id: 2,
    name: "Today’s Slips & Ideas",
    type: "room",
    lastMessage: "ValueHunter: Under 2.5 looks good here.",
    time: "15m",
    unread: 3,
  },
  {
    id: 3,
    name: "Premier League Room",
    type: "room",
    lastMessage: "DerbyTalk: London derby always chaos.",
    time: "1h",
    unread: 0,
  },
  {
    id: 4,
    name: "Serie A Chat",
    type: "room",
    lastMessage: "CalcioFan: Inter defense is too solid.",
    time: "3h",
  },
];

const demoDMs: ChatRoom[] = [
  {
    id: 101,
    name: "SlipMaster",
    type: "dm",
    lastMessage: "Bro see this 8x odds builder.",
    time: "5m",
    unread: 1,
  },
  {
    id: 102,
    name: "ValueHunter",
    type: "dm",
    lastMessage: "Safe 3x for today if you want.",
    time: "47m",
  },
];

export default function ChatPage() {
  // For now just show rooms; later could add state for selected tab.
  const activeTab: "rooms" | "dms" = "rooms";
  const list = activeTab === "rooms" ? demoRooms : demoDMs;

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
          <button className="text-[11px] px-3 py-1.5 rounded-full bg-[#111111] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[#A4FF2F] hover:border-[#A4FF2F] transition">
            New room
          </button>
        </section>

        {/* Tabs: Rooms / DMs */}
        <section className="rounded-full bg-[#050505] border border-[#1F1F1F] p-1 flex text-[11px]">
          <button className="flex-1 rounded-full bg-[#111111] text-white py-1.5">
            Rooms
          </button>
          <button className="flex-1 rounded-full text-[#888] py-1.5">
            DMs
          </button>
        </section>

        {/* Conversations list */}
        <section className="space-y-2">
          {list.map((room) => (
            <article
              key={room.id}
              className="rounded-2xl bg-[#111111] border border-[#1F1F1F] px-3 py-2.5 flex items-center gap-3 hover:bg-[#141414] transition-colors"
            >
              {/* Avatar circle */}
              <div className="h-9 w-9 rounded-full bg-[#0B0B0B] border border-[#1F1F1F] flex items-center justify-center text-[10px] text-[#A4FF2F] font-semibold">
                {room.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-[#E5E5E5] truncate">
                    {room.name}
                  </p>
                  <span className="text-[10px] text-[#777] shrink-0">
                    {room.time}
                  </span>
                </div>
                <p className="text-[11px] text-[#888] truncate mt-0.5">
                  {room.lastMessage}
                </p>
              </div>

              {/* Right side badges */}
              <div className="flex flex-col items-end gap-1 text-[10px]">
                {room.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0B0B0B] border border-[#A4FF2F] text-[#A4FF2F]">
                    {room.badge}
                  </span>
                )}
                {room.unread && room.unread > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-[#A4FF2F] text-black flex items-center justify-center text-[10px] font-semibold">
                    {room.unread}
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Small info note */}
        <section className="pb-4">
          <p className="text-[10px] text-[#777]">
            Chat is currently in mock mode. Later you’ll be able to join rooms,
            send messages and create private groups around your slips.
          </p>
        </section>
      </div>
    </>
  );
}