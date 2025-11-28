/**
 * BaseSkeleton - 공용 스켈레톤 UI 컴포넌트
 *
 * 다양한 레이아웃에 맞는 스켈레톤 UI를 제공합니다.
 */
import { cn } from "../../utils/cn";

interface BaseSkeletonProps {
  variant: "card" | "list" | "chart" | "header" | "paragraph" | "custom";
  count?: number;
  className?: string;
  "aria-label"?: string;
  children?: React.ReactNode;
}

interface SkeletonItemProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * 기본 스켈레톤 아이템 컴포넌트
 */
function SkeletonItem({ className = "", children, style }: SkeletonItemProps) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded", className)}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

/**
 * 카드형 스켈레톤
 */
function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      {/* 헤더 영역 */}
      <div className="flex items-center mb-4">
        <SkeletonItem className="w-12 h-12 rounded-full mr-4" />
        <div className="flex-1">
          <SkeletonItem className="h-5 w-3/4 mb-2" />
          <SkeletonItem className="h-4 w-1/2" />
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="space-y-3">
        <SkeletonItem className="h-4 w-full" />
        <SkeletonItem className="h-4 w-5/6" />
        <SkeletonItem className="h-4 w-4/6" />
      </div>

      {/* 푸터 영역 */}
      <div className="flex justify-between items-center mt-6">
        <SkeletonItem className="h-8 w-20" />
        <SkeletonItem className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * 리스트형 스켈레톤
 */
function ListSkeleton() {
  return (
    <div className="flex items-center p-4 border-b border-gray-100">
      <SkeletonItem className="w-16 h-16 rounded-lg mr-4" />
      <div className="flex-1">
        <SkeletonItem className="h-5 w-3/4 mb-2" />
        <SkeletonItem className="h-4 w-1/2 mb-2" />
        <div className="flex gap-2">
          <SkeletonItem className="h-6 w-16 rounded-full" />
          <SkeletonItem className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <SkeletonItem className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * 차트형 스켈레톤
 */
function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      {/* 차트 제목 */}
      <div className="mb-6">
        <SkeletonItem className="h-6 w-48 mb-2" />
        <SkeletonItem className="h-4 w-32" />
      </div>

      {/* 차트 영역 */}
      <div className="h-64 relative mb-4">
        {/* Y축 라벨들 */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <SkeletonItem key={i} className="h-3 w-8" />
          ))}
        </div>

        {/* 차트 바들 */}
        <div className="ml-12 h-full flex items-end justify-between px-4">
          {[...Array(7)].map((_, i) => (
            <SkeletonItem
              key={i}
              className="w-8"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>

        {/* X축 라벨들 */}
        <div className="ml-12 mt-2 flex justify-between px-4">
          {[...Array(7)].map((_, i) => (
            <SkeletonItem key={i} className="h-3 w-6" />
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            <SkeletonItem className="w-4 h-4 rounded mr-2" />
            <SkeletonItem className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 헤더형 스켈레톤
 */
function HeaderSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonItem className="h-8 w-2/5" />
      <SkeletonItem className="h-5 w-3/5" />
    </div>
  );
}

/**
 * 문단형 스켈레톤
 */
function ParagraphSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonItem className="h-4 w-full" />
      <SkeletonItem className="h-4 w-full" />
      <SkeletonItem className="h-4 w-3/4" />
    </div>
  );
}

/**
 * 메인 BaseSkeleton 컴포넌트
 */
export function BaseSkeleton({
  variant,
  count = 3,
  className = "",
  "aria-label": ariaLabel = "컨텐츠 로딩 중",
  children,
}: BaseSkeletonProps) {
  const renderSkeletonItem = () => {
    switch (variant) {
      case "card":
        return <CardSkeleton />;
      case "list":
        return <ListSkeleton />;
      case "chart":
        return <ChartSkeleton />;
      case "header":
        return <HeaderSkeleton />;
      case "paragraph":
        return <ParagraphSkeleton />;
      case "custom":
        return children || <SkeletonItem className="h-20 w-full" />;
      default:
        return <SkeletonItem className="h-20 w-full" />;
    }
  };

  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-label={ariaLabel}
    >
      {/* 스크린 리더용 로딩 메시지 */}
      <span className="sr-only">{ariaLabel}</span>

      {/* 스켈레톤 아이템들 */}
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeletonItem()}</div>
      ))}
    </div>
  );
}

/**
 * 개별 스켈레톤 컴포넌트들 내보내기 (필요시 직접 사용)
 */
export {
  CardSkeleton,
  ChartSkeleton,
  HeaderSkeleton,
  ListSkeleton,
  ParagraphSkeleton,
  SkeletonItem,
};

export default BaseSkeleton;
