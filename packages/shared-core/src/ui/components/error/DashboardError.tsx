"use client";

import { BaseErrorUI } from "./BaseErrorUI";

// Next.js router를 optional로 처리
interface RouterLike {
  push: (url: string) => void;
  refresh: () => void;
}

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  router?: RouterLike;
}

/**
 * 대시보드 페이지 에러 처리 컴포넌트
 */
export default function DashboardError({ error, reset, router }: DashboardErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <BaseErrorUI
          error={error}
          onRetry={reset}
          onGoHome={() => router?.push("/")}
        />
      </div>
    </div>
  );
}
