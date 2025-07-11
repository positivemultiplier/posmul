/**
 * Base Skeleton Loading Component
 */

interface BaseSkeletonProps {
  className?: string;
  count?: number;
}

export function BaseSkeleton({ className = "", count = 1 }: BaseSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

export default BaseSkeleton;
