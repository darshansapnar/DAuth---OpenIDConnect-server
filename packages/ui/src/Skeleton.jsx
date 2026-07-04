import * as React from 'react';

/**
 * Reusable Skeleton loader for data loading states.
 */
export function Skeleton({ className = '', ...props }) {
  return <div className={`animate-pulse rounded bg-gray-200/80 dark:bg-zinc-800 ${className}`} {...props} />;
}

export function SkeletonCircle({ size = 'h-10 w-10', className = '', ...props }) {
  return (
    <div className={`animate-pulse rounded-full bg-gray-200/80 dark:bg-zinc-800 ${size} ${className}`} {...props} />
  );
}

export function SkeletonText({ lines = 3, className = '', ...props }) {
  return (
    <div className={`space-y-2.5 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded bg-gray-200/80 dark:bg-zinc-800 h-3.5 ${
            index === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`border border-gray-200 dark:border-white/5 rounded-xl p-6 bg-white dark:bg-[#18181B] space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size="h-10 w-10" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
