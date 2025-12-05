import Skeleton from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <main className="pt-2 pb-4 space-y-4">
      {/* Hero card skeleton */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full mt-2" />
      </section>

      {/* Quick stats skeleton */}
      <section className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </section>

      {/* Hot picks heading */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </section>

      {/* Fixtures list heading */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </section>
    </main>
  );
}