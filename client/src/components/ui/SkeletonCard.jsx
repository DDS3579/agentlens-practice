
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-3">
      <Skeleton className="h-6 w-1/3 bg-white/10" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-4 bg-white/10"
          style={{ width: `${85 - index * 10}%` }}
        />
      ))}
    </div>
  );
}

export function AnalysisItemSkeleton() {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 bg-white/10" />
            <Skeleton className="h-3 w-24 bg-white/10" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-md bg-white/10" />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded bg-white/10" />
          <Skeleton className="h-4 w-16 bg-white/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded bg-white/10" />
          <Skeleton className="h-4 w-12 bg-white/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded bg-white/10" />
          <Skeleton className="h-4 w-20 bg-white/10" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <Skeleton className="h-3 w-32 bg-white/10" />
        <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20 bg-white/10" />
        <Skeleton className="h-3 w-12 bg-white/10" />
      </div>
      <Skeleton className="h-2 w-2 rounded-full bg-white/10" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3"
        >
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 bg-white/10" />
            <Skeleton className="h-5 w-10 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-8">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg bg-white/10" />
        </div>

        {/* Stats skeleton */}
        <StatsSkeleton />

        {/* Tabs skeleton */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-9 w-24 rounded-md bg-white/10"
            />
          ))}
        </div>

        {/* Content area skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={3} />
            <CardSkeleton lines={5} />
          </div>
          <div className="space-y-4">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardSkeleton;
