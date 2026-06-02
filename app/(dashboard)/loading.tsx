import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/40 bg-white/70 p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-full max-w-3xl" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-4 h-9 w-24" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-12 w-full" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5">
          <Skeleton className="h-5 w-36" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
