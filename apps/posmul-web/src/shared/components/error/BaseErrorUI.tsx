/**
 * Base Error UI Component
 * 공통 오류 표시 컴포넌트
 */
import React from "react";

export interface BaseErrorUIProps {
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export default function BaseErrorUI({
  title = "오류가 발생했습니다",
  message = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  retry,
  className = "",
}: BaseErrorUIProps) {
  return (
    <div
      className={`p-6 text-center bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="mb-4">
        <svg
          className="w-12 h-12 text-red-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>

      <p className="text-red-600 mb-4">{message}</p>

      {retry && (
        <button
          onClick={retry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
