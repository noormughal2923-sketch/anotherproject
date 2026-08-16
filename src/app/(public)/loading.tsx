import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading content">
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <Skeleton className="mx-auto h-6 w-52" />
        <Skeleton className="mx-auto h-14 w-full max-w-xl" />
        <Skeleton className="mx-auto h-5 w-full max-w-2xl" />
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
    </div>
  );
}
