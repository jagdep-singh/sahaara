import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-12 w-64 max-w-full" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-xl" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
