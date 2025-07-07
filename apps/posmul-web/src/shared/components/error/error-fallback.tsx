'use client';

import { ValidationError } from "@posmul/auth-economy-sdk";


export interface ErrorFallbackProps {
  error: Error;
}

/**
 * 일반적인 에러 fallback 컴포넌트
 * 다양한 에러 타입에 대응하는 UI 제공
 */
export function ErrorFallback({ error }: ErrorFallbackProps) {
  const getErrorMessage = (error: Error): string => {
    if (error instanceof ValidationError) {
      return error.message || '입력 데이터를 확인해주세요.';
    }
    
    // 네트워크 에러
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    // 인증 에러
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return '로그인이 필요하거나 권한이 없습니다.';
    }
    
    // 기본 메시지
    return error.message || '예상치 못한 오류가 발생했습니다.';
  };

  const getErrorType = (error: Error): string => {
    if (error instanceof ValidationError) return '입력 오류';
    if (error.message.includes('fetch')) return '네트워크 오류';
    if (error.message.includes('unauthorized')) return '인증 오류';
    return '시스템 오류';
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
      <div className="text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h3 className="mb-2 text-lg font-semibold text-red-800">
          {getErrorType(error)}
        </h3>
        
        <p className="mb-6 text-red-700 max-w-md">
          {getErrorMessage(error)}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
              개발자 정보
            </summary>
            <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto max-w-md">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
