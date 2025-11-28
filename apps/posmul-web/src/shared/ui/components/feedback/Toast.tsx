"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// Toast 타입 정의
type ToastType = "success" | "error" | "info" | "warning" | "pmc-reward" | "pmp-reward";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  amount?: number; // PMC/PMP 보상일 경우
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  // 편의 메서드
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  pmcReward: (amount: number, message?: string) => void;
  pmpReward: (amount: number, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// 토스트 아이콘 및 스타일
const toastStyles: Record<ToastType, { icon: string; bgClass: string; borderClass: string }> = {
  success: {
    icon: "✅",
    bgClass: "bg-green-50 dark:bg-green-900/30",
    borderClass: "border-green-500",
  },
  error: {
    icon: "❌",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    borderClass: "border-red-500",
  },
  info: {
    icon: "ℹ️",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
    borderClass: "border-blue-500",
  },
  warning: {
    icon: "⚠️",
    bgClass: "bg-yellow-50 dark:bg-yellow-900/30",
    borderClass: "border-yellow-500",
  },
  "pmc-reward": {
    icon: "🎉",
    bgClass: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30",
    borderClass: "border-purple-500",
  },
  "pmp-reward": {
    icon: "💰",
    bgClass: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
    borderClass: "border-blue-500",
  },
};

// 개별 토스트 컴포넌트
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = toastStyles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const isPMCReward = toast.type === "pmc-reward";
  const isPMPReward = toast.type === "pmp-reward";

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-lg border-l-4
        ${style.bgClass} ${style.borderClass}
        animate-slide-in-right
        max-w-sm w-full
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{style.icon}</span>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 dark:text-white">
              {toast.title}
            </div>
            
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {toast.message}
              </p>
            )}
            
            {/* PMC/PMP 보상 표시 */}
            {(isPMCReward || isPMPReward) && toast.amount && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`
                  text-2xl font-bold
                  ${isPMCReward ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}
                `}>
                  +{toast.amount.toLocaleString()}
                </span>
                <span className={`
                  text-sm font-medium px-2 py-0.5 rounded-full
                  ${isPMCReward 
                    ? "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200" 
                    : "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  }
                `}>
                  {isPMCReward ? "PMC" : "PMP"}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 진행바 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full ${isPMCReward ? "bg-purple-500" : isPMPReward ? "bg-blue-500" : style.borderClass.replace("border-", "bg-")}`}
          style={{
            animation: `shrink ${toast.duration || 5000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// 토스트 컨테이너
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 편의 메서드들
  const success = useCallback((title: string, message?: string) => {
    addToast({ type: "success", title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: "error", title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: "info", title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: "warning", title, message });
  }, [addToast]);

  const pmcReward = useCallback((amount: number, message?: string) => {
    addToast({
      type: "pmc-reward",
      title: "PMC 획득!",
      message: message || "예측에 성공했습니다!",
      amount,
      duration: 7000, // 보상은 더 오래 표시
    });
  }, [addToast]);

  const pmpReward = useCallback((amount: number, message?: string) => {
    addToast({
      type: "pmp-reward",
      title: "PMP 획득!",
      message: message || "활동 보상을 받았습니다!",
      amount,
      duration: 7000,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
        pmcReward,
        pmpReward,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// CSS Animation (globals.css에 추가 필요)
// @keyframes slide-in-right {
//   from { transform: translateX(100%); opacity: 0; }
//   to { transform: translateX(0); opacity: 1; }
// }
// @keyframes shrink {
//   from { width: 100%; }
//   to { width: 0%; }
// }
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }
