/**
 * NotificationToast 컴포넌트
 *
 * 실시간 알림을 토스트 형태로 표시합니다.
 * realtime-data-store의 notifications를 구독합니다.
 */
"use client";

import React, { useEffect, useState } from "react";

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/** 알림 타입 */
export type NotificationType = "success" | "error" | "info" | "warning";

/** 알림 데이터 */
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    autoHide?: boolean;
    duration?: number;
}

/** Props */
interface NotificationToastProps {
    /** 알림 데이터 */
    notification: Notification;
    /** 닫기 핸들러 */
    onClose: (id: string) => void;
}

/** 알림 컨테이너 Props */
interface NotificationContainerProps {
    /** 알림 목록 */
    notifications: Notification[];
    /** 알림 닫기 핸들러 */
    onClose: (id: string) => void;
    /** 위치 */
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/** 타입별 아이콘 */
const getIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5";
    switch (type) {
        case "success":
            return <CheckCircle className={`${iconClass} text-green-400`} />;
        case "error":
            return <AlertCircle className={`${iconClass} text-red-400`} />;
        case "warning":
            return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
        case "info":
        default:
            return <Info className={`${iconClass} text-blue-400`} />;
    }
};

/** 타입별 배경색 */
const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
        case "success":
            return "bg-green-500/10 border-green-500/30";
        case "error":
            return "bg-red-500/10 border-red-500/30";
        case "warning":
            return "bg-yellow-500/10 border-yellow-500/30";
        case "info":
        default:
            return "bg-blue-500/10 border-blue-500/30";
    }
};

/**
 * 단일 알림 토스트
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onClose,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // 진입 애니메이션
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // 자동 숨김
    useEffect(() => {
        if (notification.autoHide !== false) {
            const duration = notification.duration || 5000;
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [notification.autoHide, notification.duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose(notification.id);
        }, 300);
    };

    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        ${getBackgroundColor(notification.type)}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
                }
        shadow-lg max-w-sm
      `}
        >
            {getIcon(notification.type)}

            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
                {notification.message && (
                    <p className="text-slate-300 text-xs mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                )}
            </div>

            <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
                aria-label="닫기"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

/**
 * 알림 컨테이너
 *
 * @example
 * ```tsx
 * <NotificationContainer
 *   notifications={notifications}
 *   onClose={handleClose}
 *   position="top-right"
 * />
 * ```
 */
export const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    onClose,
    position = "top-right",
}) => {
    // 위치별 스타일
    const positionStyles: Record<string, string> = {
        "top-right": "top-4 right-4",
        "top-left": "top-4 left-4",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
    };

    if (notifications.length === 0) return null;

    return (
        <div
            className={`fixed ${positionStyles[position]} z-50 flex flex-col gap-2`}
            aria-live="polite"
            aria-label="알림"
        >
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

export default NotificationToast;
