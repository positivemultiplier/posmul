/**
 * 투자 페이지 로딩 컴포넌트
 *
 * BaseSkeleton을 활용하여 투자 기회 카드와 포트폴리오 통계의 스켈레톤 UI를 제공합니다.
 */

import { BaseSkeleton } from "@posmul/shared-ui";

export default function InvestmentLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 헤더 영역 */}
      <BaseSkeleton variant="header" />

      {/* 투자 기회 카드들 */}
      <BaseSkeleton variant="card" count={6} />

      {/* 포트폴리오 통계 */}
      <BaseSkeleton variant="chart" />
    </div>
  );
}
