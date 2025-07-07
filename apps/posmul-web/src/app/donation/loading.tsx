/**
 * 기부 페이지 로딩 컴포넌트
 *
 * BaseSkeleton을 활용하여 기부 프로젝트와 머니 웨이브의 스켈레톤 UI를 제공합니다.
 */

import { BaseSkeleton } from "../../shared/ui";

export default function DonationLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 헤더 영역 */}
      <BaseSkeleton variant="header" />

      {/* 기부 프로젝트 카드들 */}
      <BaseSkeleton variant="card" count={6} />

      {/* 머니 웨이브 정보 */}
      <BaseSkeleton variant="chart" />
    </div>
  );
}
