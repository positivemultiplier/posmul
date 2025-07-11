/**
 * BaseErrorUI - 공용 에러 UI 컴포넌트
 *
 * 기존 BaseError 클래스와 연동하여 사용자 친화적인 에러 화면을 제공합니다.
 */

import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { BaseError } from "../../../../src/shared/types/base-error";
import Button from "../../../../src/shared/ui/components/base/Button";

interface CustomAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary" | "default" | "danger";
}

interface BaseErrorUIProps {
  error: BaseError | Error;
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
    const { code, statusCode } = error;

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
        description: "이 페이지에 접근할 권한이 없습니다.",
        icon: "🚫",
        canRetry: false,
        severity: "error" as const,
      };
    }

    if (statusCode === 404) {
      return {
        type: "페이지 없음",
        title: "페이지를 찾을 수 없습니다",
        description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.",
        icon: "🔍",
        canRetry: false,
        severity: "info" as const,
      };
    }

    if (statusCode >= 500) {
      return {
        type: "서버 오류",
        title: "일시적인 서버 오류가 발생했습니다",
        description:
          "잠시 후 다시 시도해주세요. 문제가 지속되면 고객센터로 문의해주세요.",
        icon: "⚠️",
        canRetry: true,
        severity: "error" as const,
      };
    }
  }

  // 일반 Error 또는 기타 경우 메시지 분석
  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return {
      type: "네트워크 오류",
      title: "인터넷 연결을 확인해주세요",
      description:
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.",
      icon: "🌐",
      canRetry: true,
      severity: "warning" as const,
    };
  }

  if (message.includes("timeout")) {
    return {
      type: "시간 초과",
      title: "요청 시간이 초과되었습니다",
      description: "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
      icon: "⏱️",
      canRetry: true,
      severity: "warning" as const,
    };
  }

  // 기본 에러 메시지
  return {
    type: "알 수 없는 오류",
    title: "예상치 못한 오류가 발생했습니다",
    description:
      "문제가 지속되면 페이지를 새로고침하거나 고객센터로 문의해주세요.",
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

  return (
    <div
      className={`max-w-2xl mx-auto p-8 rounded-lg border ${styles.container} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* 에러 아이콘 및 타입 */}
      <div className="flex items-center mb-6">
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
      <p className={`text-lg mb-8 ${styles.description}`}>
        {errorInfo.description}
      </p>

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {errorInfo.canRetry && onRetry && (
          <Button
            onClick={onRetry}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
        {onGoBack && (
          <Button
            onClick={onGoBack}
            variant="default"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지
          </Button>
        )}{" "}
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
        <details className="mt-6">
          <summary
            className={`cursor-pointer text-sm font-medium ${styles.description} hover:underline`}
          >
            기술적 상세 정보
          </summary>
          <div className="mt-3 p-4 bg-gray-100 rounded-md text-sm font-mono text-gray-800">
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
                  <strong>운영 에러:</strong>{" "}
                  {error.isOperational ? "Yes" : "No"}
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
