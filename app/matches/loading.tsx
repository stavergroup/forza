import Skeleton from "@/components/Skeleton";

export default function MatchesLoading() {
  return (
    <main className="pt-2 pb-4 space-y-4">
      <section className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <p className="text-[11px] text-slate-500">
          Loading today's fixtures…
        </p>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </section>
    </main>
  );
}