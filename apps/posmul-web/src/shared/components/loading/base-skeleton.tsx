// 간단한 클래스 결합 함수
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

export interface BaseSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

/**
 * 기본 스켈레톤 컴포넌트
 * 다양한 로딩 상태에 사용할 수 있는 재사용 가능한 스켈레톤
 */
export function BaseSkeleton({ 
  className, 
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = true,
  ...props 
}: BaseSkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        roundedClasses[rounded],
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      {...props}
    />
  );
}

/**
 * 카드 스켈레톤 컴포넌트
 * 카드 형태의 콘텐츠 로딩에 사용
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)}>
      <BaseSkeleton height="20px" width="60%" />
      <BaseSkeleton height="16px" width="100%" />
      <BaseSkeleton height="16px" width="80%" />
      <div className="flex space-x-2 pt-2">
        <BaseSkeleton height="32px" width="80px" rounded="sm" />
        <BaseSkeleton height="32px" width="80px" rounded="sm" />
      </div>
    </div>
  );
}

/**
 * 리스트 스켈레톤 컴포넌트
 * 리스트 아이템들의 로딩에 사용
 */
export function ListSkeleton({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
          <BaseSkeleton height="40px" width="40px" rounded="full" />
          <div className="flex-1 space-y-2">
            <BaseSkeleton height="16px" width="70%" />
            <BaseSkeleton height="14px" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}
