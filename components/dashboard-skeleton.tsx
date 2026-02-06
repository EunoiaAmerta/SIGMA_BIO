"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RankCardSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  );
}

export function LeaderboardSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <Skeleton className="h-8 w-40 mb-6" />
      <Skeleton className="h-80 w-full" />
    </Card>
  );
}

export function BioBankSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-12 w-full mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}
