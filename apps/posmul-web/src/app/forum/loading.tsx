/**
 * 포럼 페이지 로딩 컴포넌트
 *
 * BaseSkeleton을 활용하여 토론 주제 카드와 브레인스토밍 세션의 스켈레톤 UI를 제공합니다.
 */

import { BaseSkeleton } from "@posmul/shared-ui";

export default function ForumLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 헤더 영역 */}
      <BaseSkeleton variant="header" />

      {/* 토론 주제 카드들 */}
      <BaseSkeleton variant="card" count={5} />

      {/* 브레인스토밍 세션 */}
      <BaseSkeleton variant="list" count={3} />
    </div>
  );
}
