import { useCallback, useEffect, useState } from "react";

export type NotificationType =
  | "GAME_START"
  | "GAME_END"
  | "PRICE_CHANGE"
  | "NEW_BET"
  | "GAME_SETTLEMENT"
  | "PARTICIPANT_JOIN"
  | "SYSTEM_UPDATE"
  | "LOW_BALANCE";

export type NotificationPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: "primary" | "danger" | "secondary" | string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  gameId?: string;
  gameTitle?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export type NotificationInput = Omit<
  NotificationItem,
  "id" | "timestamp" | "isRead"
>;

export interface NotificationSettings {
  enabled: boolean;
  gameStart: boolean;
  gameEnd: boolean;
  priceChanges: boolean;
  newBets: boolean;
  gameSettlement: boolean;
  participantUpdates: boolean;
  systemUpdates: boolean;
  sound: boolean;
  desktop: boolean;
  minimumPriceChange: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    gameStart: true,
    gameEnd: true,
    priceChanges: true,
    newBets: false,
    gameSettlement: true,
    participantUpdates: false,
    systemUpdates: true,
    sound: true,
    desktop: false,
    minimumPriceChange: 5, // 5% 이상 변화시만 알림
  });
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // 브라우저 알림 권한 확인 및 요청
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);

      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setPermission(permission);
        });
      }
    }
  }, []);

  // 로컬스토리지에서 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem("notification-settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings) as NotificationSettings);
      } catch {
        // 알림 설정 로드 실패시 기본값 사용
      }
    }
  }, []);

  // 설정 저장
  useEffect(() => {
    localStorage.setItem("notification-settings", JSON.stringify(settings));
  }, [settings]);

  // 사운드 재생
  const playNotificationSound = (priority: NotificationPriority) => {
    try {
      const audio = new Audio();

      switch (priority) {
        case "URGENT":
          audio.src = "/sounds/urgent.mp3";
          break;
        case "HIGH":
          audio.src = "/sounds/high.mp3";
          break;
        case "MEDIUM":
          audio.src = "/sounds/medium.mp3";
          break;
        default:
          audio.src = "/sounds/low.mp3";
          break;
      }

      audio.volume = 0.3;
      audio.play().catch(() => {
        // 사운드 재생 실패시 무시
      });
    } catch {
      // 알림 사운드 오류시 무시
    }
  };

  // 데스크톱 알림 표시
  const showDesktopNotification = useCallback(
    (notification: NotificationItem) => {
      if (permission !== "granted") return;

      try {
        const desktopNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.gameId || notification.type,
          requireInteraction: notification.priority === "URGENT",
        });

        desktopNotification.onclick = () => {
          window.focus();
          desktopNotification.close();
        };

        // 자동 닫기 (긴급하지 않은 경우)
        if (notification.priority !== "URGENT") {
          setTimeout(() => {
            desktopNotification.close();
          }, 5000);
        }
      } catch {
        // 데스크톱 알림 표시 실패시 무시
      }
    },
    [permission]
  );

  // 알림 추가
  const addNotification = useCallback(
    (notification: NotificationInput): string | undefined => {
      if (!settings.enabled) return;

      // 타입별 설정 확인
      const typeEnabled: Record<NotificationType, boolean> = {
        GAME_START: settings.gameStart,
        GAME_END: settings.gameEnd,
        PRICE_CHANGE: settings.priceChanges,
        NEW_BET: settings.newBets,
        GAME_SETTLEMENT: settings.gameSettlement,
        PARTICIPANT_JOIN: settings.participantUpdates,
        SYSTEM_UPDATE: settings.systemUpdates,
        LOW_BALANCE: true, // 항상 표시
      };

      if (!typeEnabled[notification.type]) return;

      const newNotification: NotificationItem = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // 최대 50개 유지

      // 사운드 재생
      if (settings.sound) {
        playNotificationSound(notification.priority);
      }

      // 데스크톱 알림 표시
      if (settings.desktop && permission === "granted") {
        showDesktopNotification(newNotification);
      }

      return newNotification.id;
    },
    [settings, permission, showDesktopNotification]
  );

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  }, []);

  // 알림 제거
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // 모든 알림 제거
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 게임별 알림 제거
  const clearGameNotifications = useCallback((gameId: string) => {
    setNotifications((prev) => prev.filter((n) => n.gameId !== gameId));
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  // 미리 정의된 알림 생성 함수들
  const createGameStartNotification = useCallback(
    (gameId: string, gameTitle: string) => {
      return addNotification({
        type: "GAME_START",
        title: "🎮 게임 시작됨",
        message: `"${gameTitle}" 예측 게임이 시작되었습니다!`,
        priority: "MEDIUM",
        gameId,
        gameTitle,
      });
    },
    [addNotification]
  );

  const createGameEndNotification = useCallback(
    (gameId: string, gameTitle: string, minutesLeft?: number) => {
      const message = minutesLeft
        ? `"${gameTitle}" 게임이 ${minutesLeft}분 후 마감됩니다.`
        : `"${gameTitle}" 게임이 마감되었습니다.`;

      return addNotification({
        type: "GAME_END",
        title: "⏰ 게임 마감",
        message,
        priority: minutesLeft && minutesLeft <= 5 ? "HIGH" : "MEDIUM",
        gameId,
        gameTitle,
      });
    },
    [addNotification]
  );

  const createPriceChangeNotification = useCallback(
    (
      gameId: string,
      gameTitle: string,
      option: string,
      oldPrice: number,
      newPrice: number
    ) => {
      const change = newPrice - oldPrice;
      const changePercent = ((change / oldPrice) * 100).toFixed(1);

      // 최소 변화량 체크
      if (Math.abs(parseFloat(changePercent)) < settings.minimumPriceChange) {
        return null;
      }

      return addNotification({
        type: "PRICE_CHANGE",
        title: "📈 확률 변화",
        message: `"${gameTitle}" - ${option}: ${changePercent}% ${change > 0 ? "상승" : "하락"}`,
        priority: Math.abs(parseFloat(changePercent)) > 15 ? "HIGH" : "MEDIUM",
        gameId,
        gameTitle,
        data: { option, oldPrice, newPrice, change, changePercent },
      });
    },
    [addNotification, settings.minimumPriceChange]
  );

  const createSettlementNotification = useCallback(
    (
      gameId: string,
      gameTitle: string,
      result: string,
      winnings?: number
    ) => {
      const message = winnings
        ? `"${gameTitle}" 정산 완료! ${winnings} PMP를 획득했습니다.`
        : `"${gameTitle}" 게임이 정산되었습니다. 결과: ${result}`;

      return addNotification({
        type: "GAME_SETTLEMENT",
        title: "🏆 게임 정산",
        message,
        priority: winnings ? "HIGH" : "MEDIUM",
        gameId,
        gameTitle,
        data: { result, winnings },
      });
    },
    [addNotification]
  );

  // 통계
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    urgent: notifications.filter((n) => n.priority === "URGENT" && !n.isRead)
      .length,
    high: notifications.filter((n) => n.priority === "HIGH" && !n.isRead)
      .length,
  };

  return {
    notifications,
    settings,
    permission,
    stats,

    // 액션
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    clearGameNotifications,
    updateSettings,

    // 미리 정의된 알림 생성자
    createGameStartNotification,
    createGameEndNotification,
    createPriceChangeNotification,
    createSettlementNotification,
  };
}

export default useNotifications;
