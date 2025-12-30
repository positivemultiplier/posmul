/**
 * BaseErrorUI - 공용 에러 UI 컴포넌트
 *
 * 기존 BaseError 클래스와 연동하여 사용자 친화적인 에러 화면을 제공합니다.
 */
import { AuthEconomyError } from "@posmul/auth-economy-sdk";
import { ChevronDown, Home, RotateCw } from "lucide-react";

import { BaseError } from "../../../types/base-error";
import { Button } from "../base";

interface CustomAction {
  label: string;
  action: () => void;
  variant?:
  | "primary"
  | "secondary"
  | "default"
  | "danger"
  | "ghost"
  | "outline";
}

interface BaseErrorUIProps {
  error: AuthEconomyError | Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showDetails?: boolean;
  className?: string;
  customActions?: CustomAction[];
}

/**
 * 에러 타입에 따른 사용자 친화적 메시지 생성
 */
function getErrorDisplayInfo(error: BaseError | Error) {
  // BaseError인 경우 상세 정보 활용
  if (error instanceof BaseError) {
    const { statusCode } = error;

    // 상태 코드별 메시지 분류
    if (statusCode === 401) {
      return {
        type: "인증 오류",
        title: "로그인이 필요합니다",
        description: "이 기능을 사용하려면 로그인이 필요합니다.",
        icon: "🔐",
        canRetry: false,
        severity: "warning" as const,
      };
    }

    if (statusCode === 403) {
      return {
        type: "권한 오류",
        title: "접근 권한이 없습니다",
        description: "이 작업을 수행할 권한이 없습니다. 관리자에게 문의하세요.",
        icon: "🚫",
        canRetry: false,
        severity: "error" as const,
      };
    }

    if (statusCode === 404) {
      return {
        type: "리소스 없음",
        title: "페이지를 찾을 수 없습니다",
        description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.",
        icon: "🔍",
        canRetry: false,
        severity: "warning" as const,
      };
    }

    if (statusCode === 429) {
      return {
        type: "요청 제한",
        title: "너무 많은 요청이 발생했습니다",
        description: "잠시 후 다시 시도해주세요.",
        icon: "⏱️",
        canRetry: true,
        severity: "warning" as const,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        type: "서버 오류",
        title: "서버에서 문제가 발생했습니다",
        description:
          "잠시 후 다시 시도해주세요. 문제가 지속되면 고객지원팀에 연락하세요.",
        icon: "🔧",
        canRetry: true,
        severity: "error" as const,
      };
    }

    // 비즈니스 로직 에러 (400번대 기타)
    return {
      type: "요청 오류",
      title: "입력 정보를 확인해주세요",
      description: error.message || "입력하신 정보에 문제가 있습니다.",
      icon: "⚠️",
      canRetry: false,
      severity: "warning" as const,
    };
  }

  // 일반 Error인 경우
  return {
    type: "시스템 오류",
    title: "예상치 못한 오류가 발생했습니다",
    description: "페이지를 새로고침하거나 잠시 후 다시 시도해주세요.",
    icon: "❌",
    canRetry: true,
    severity: "error" as const,
  };
}

/**
 * 심각도에 따른 스타일 클래스 반환
 */
function getSeverityClasses(severity: "info" | "warning" | "error") {
  switch (severity) {
    case "info":
      return {
        container: "border-blue-200 bg-blue-50",
        icon: "text-blue-600",
        title: "text-blue-900",
        description: "text-blue-700",
      };
    case "warning":
      return {
        container: "border-yellow-200 bg-yellow-50",
        icon: "text-yellow-600",
        title: "text-yellow-900",
        description: "text-yellow-700",
      };
    case "error":
    default:
      return {
        container: "border-red-200 bg-red-50",
        icon: "text-red-600",
        title: "text-red-900",
        description: "text-red-700",
      };
  }
}

export function BaseErrorUI({
  error,
  onRetry,
  onGoHome,
  onGoBack,
  showDetails = false,
  className = "",
  customActions = [],
}: BaseErrorUIProps) {
  const errorInfo = getErrorDisplayInfo(error);
  const styles = getSeverityClasses(errorInfo.severity);
  const isOperational =
    error instanceof BaseError ? error.isOperational : false;

  // Error Illustration Map
  const errorIllustrations: Record<number, string> = {
    404: "/images/error-404.png",
    500: "/images/error-404.png", // Using 404 robot for generic error for now, or use a specific 500 one if generated
  };

  const illustrationSrc =
    (error instanceof BaseError && error.statusCode ? errorIllustrations[error.statusCode] : null);

  return (
    <div
      className={`max-w-2xl mx-auto p-8 rounded-lg border ${styles.container} ${className} relative overflow-hidden`}
      role="alert"
      aria-live="assertive"
    >
      {/* Background Illustration for specific errors */}
      {illustrationSrc && (
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none -mt-10 -mr-10">
          <img src={illustrationSrc} alt="Error Illustration" className="w-full h-full object-contain" />
        </div>
      )}

      {/* 에러 아이콘 및 타입 */}
      <div className="flex items-center mb-6 relative z-10">
        <div className={`text-4xl mr-4 ${styles.icon}`} aria-hidden="true">
          {errorInfo.icon}
        </div>
        <div>
          <div className={`text-sm font-medium ${styles.description} mb-1`}>
            {errorInfo.type}
          </div>
          <h1 className={`text-2xl font-bold ${styles.title}`}>
            {errorInfo.title}
          </h1>
        </div>
      </div>

      {/* 에러 설명 */}
      <p className={`text-lg mb-8 ${styles.description} relative z-10`}>
        {errorInfo.description}
      </p>

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 relative z-10">
        {errorInfo.canRetry && onRetry && (
          <Button
            onClick={onRetry}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
        {onGoBack && (
          <Button
            onClick={onGoBack}
            variant="default"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            이전 페이지
          </Button>
        )}
        {onGoHome && (
          <Button
            onClick={onGoHome}
            variant="default"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        )}
        {/* Custom Actions */}
        {customActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            variant={action.variant || "default"}
            className="flex items-center justify-center"
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* 에러 상세 정보 (개발용) */}
      {showDetails && (
        <details className="mt-6 relative z-10">
          <summary
            className={`cursor-pointer text-sm font-medium ${styles.description} hover:underline`}
          >
            기술적 상세 정보
          </summary>
          <div className="mt-3 p-4 bg-gray-100/80 backdrop-blur rounded-md text-sm font-mono text-gray-800">
            <div>
              <strong>에러 메시지:</strong> {error.message}
            </div>
            {error instanceof BaseError && (
              <>
                <div>
                  <strong>에러 코드:</strong> {error.code}
                </div>
                <div>
                  <strong>상태 코드:</strong> {error.statusCode}
                </div>
                <div>
                  <strong>운영 에러:</strong> {isOperational ? "Yes" : "No"}
                </div>
              </>
            )}
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">
                  스택 트레이스
                </summary>
                <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
              </details>
            )}
          </div>
        </details>
      )}

      {/* 접근성: 스크린 리더용 추가 정보 */}
      <div className="sr-only">
        에러가 발생했습니다. {errorInfo.type}: {errorInfo.title}.{" "}
        {errorInfo.description}
        {errorInfo.canRetry && "다시 시도 버튼을 눌러 재시도할 수 있습니다."}
      </div>
    </div>
  );
}

export default BaseErrorUI;
