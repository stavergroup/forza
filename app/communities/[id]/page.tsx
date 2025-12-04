import { notFound } from "next/navigation";
import { demoCommunities, demoMessages } from "@/lib/demoData";

type CommunityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CommunityChatPage({ params }: CommunityPageProps) {
  const { id } = await params;
  const community = demoCommunities.find((c) => c.id === id);

  if (!community) {
    return notFound();
  }

  const messages = demoMessages.filter((m) => m.communityId === community.id);

  return (
    <main className="px-4 pt-4 pb-4 flex flex-col min-h-[calc(100vh-4rem)]">
      <header className="mb-3">
        <h1 className="text-sm font-semibold text-slate-100">
          {community.name}
        </h1>
        <p className="text-[11px] text-slate-400">
          {community.members.toLocaleString()} members · {community.topic}
        </p>
      </header>

      {/* Messages */}
      <section className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((msg) => {
          const isOwn = msg.isOwn;
          return (
            <div
              key={msg.id}
              className={`flex ${
                isOwn ? "justify-end" : "justify-start"
              } text-xs`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  isOwn
                    ? "bg-emerald-500 text-slate-950 rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm"
                }`}
              >
                {!isOwn && (
                  <p className="text-[10px] font-semibold text-slate-300 mb-0.5">
                    {msg.user}
                  </p>
                )}
                <p className="leading-snug">{msg.text}</p>
                <p
                  className={`mt-1 text-[9px] ${
                    isOwn ? "text-emerald-950/80" : "text-slate-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Input bar (non-functional demo) */}
      <section className="mt-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2">
          <input
            disabled
            placeholder="Type a message (demo, not yet active)..."
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <button className="text-xs font-semibold text-emerald-400">
            Send
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Real-time chat will be powered by Firestore or Supabase in the next
          phase.
        </p>
      </section>
    </main>
  );
}