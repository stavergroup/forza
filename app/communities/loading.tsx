import Skeleton from "@/components/Skeleton";

export default function CommunitiesLoading() {
  return (
    <main className="pt-2 pb-4 space-y-4">
      {/* heading */}
      <section className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </section>

      {/* create post card skeleton */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-8 w-full rounded-xl" />
      </section>

      {/* filter buttons skeleton */}
      <section className="flex gap-2">
        <Skeleton className="h-7 w-full rounded-full" />
        <Skeleton className="h-7 w-full rounded-full" />
        <Skeleton className="h-7 w-full rounded-full" />
        <Skeleton className="h-7 w-full rounded-full" />
      </section>

      {/* posts list skeleton */}
      <section className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </section>
    </main>
  );
}