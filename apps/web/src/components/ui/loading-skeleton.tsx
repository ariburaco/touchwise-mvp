import { Skeleton } from "./skeleton";

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-12">
        <Skeleton className="h-12 w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="h-12 w-12 mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <nav className="flex gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <hr />
    </div>
  );
}