"use client";

import { useEffect, useState } from "react";
import Button from "../Button";
import { Badge } from "../ui/badge";
// import type { RealtimeNotification } from "@/shared/stores/realtime-data-store";
// import {
//   useRealtimeDataStore,
//   clearAllNotifications,
//   markNotificationAsRead,
// } from "@/shared/stores/realtime-data-store";

// 토스트 알림 컴포넌트
export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: RealtimeNotification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (notification.autoHide) {
      const timer = setTimeout(() => {
        onDismiss();
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.duration, onDismiss]);

  const getIcon = (type: RealtimeNotification["type"]) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getColorClasses = (type: RealtimeNotification["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-800";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "error":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm ${getColorClasses(
        notification.type
      )}`}
    >
      <div className="text-xl">{getIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{notification.title}</div>
        <div className="text-sm mt-1">{notification.message}</div>
        <div className="text-xs mt-2 opacity-70">
          {notification.timestamp.toLocaleTimeString()}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-lg opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </motion.div>
  );
}

// 토스트 컨테이너
export function NotificationToasts() {
  const { notifications, markNotificationRead } = useRealtimeNotifications();
  const [visibleToasts, setVisibleToasts] = useState<RealtimeNotification[]>(
    []
  );

  useEffect(() => {
    // 읽지 않은 알림 중 자동 숨김이 활성화된 것들만 토스트로 표시
    const newToasts = notifications
      .filter((n) => !n.read && n.autoHide)
      .slice(0, 3); // 최대 3개까지만 표시

    setVisibleToasts(newToasts);
  }, [notifications]);

  const handleDismiss = (notificationId: string) => {
    markNotificationRead(notificationId);
    setVisibleToasts((prev) => prev.filter((n) => n.id !== notificationId));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleToasts.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// 알림 배지 (네비게이션바용)
export function NotificationBadge({
  onClick,
  className = "",
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { unreadCount } = useRealtimeNotifications();

  if (unreadCount === 0) {
    return (
      <button onClick={onClick} className={`relative ${className}`}>
        🔔
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`relative ${className}`}>
      🔔
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </button>
  );
}

// 알림 센터 (드롭다운/모달용)
export function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    clearNotifications,
  } = useRealtimeNotifications();

  const handleNotificationClick = (notification: RealtimeNotification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  const getIcon = (type: RealtimeNotification["type"]) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-12 right-0 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            알림 ({unreadCount}개 읽지 않음)
          </h3>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="text-xs"
              >
                모두 삭제
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <div>알림이 없습니다</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm ${
                        !notification.read ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {notification.timestamp.toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// 실시간 상태 표시기
export function RealtimeStatusIndicator() {
  const { isConnected, connectionError, lastConnected } =
    useRealtimeConnection();

  const getStatusIcon = () => {
    if (isConnected) return "🟢";
    if (connectionError) return "🔴";
    return "🟡";
  };

  const getStatusText = () => {
    if (isConnected) return "실시간 연결됨";
    if (connectionError) return "연결 오류";
    return "연결 중...";
  };

  const getStatusColor = () => {
    if (isConnected) return "text-green-600";
    if (connectionError) return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="animate-pulse">{getStatusIcon()}</span>
      <span className={getStatusColor()}>{getStatusText()}</span>
      {lastConnected && (
        <span className="text-gray-500">
          ({lastConnected.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}

// 전체 알림 시스템 (모든 컴포넌트를 포함)
export function RealtimeNotificationSystem() {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  return (
    <>
      {/* 토스트 알림 */}
      <NotificationToasts />

      {/* 알림 센터 (필요시 사용) */}
      <div className="relative">
        <NotificationBadge
          onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        />
        <AnimatePresence>
          {notificationCenterOpen && (
            <NotificationCenter
              isOpen={notificationCenterOpen}
              onClose={() => setNotificationCenterOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
