// 실시간 연결 시스템 통합 export
export { useRealtimeConnection } from "@/shared/hooks/use-realtime-connection";
export type {
  RealtimeConnectionConfig,
  RealtimeConnectionState,
  RealtimeMessage,
  UseRealtimeConnectionReturn,
} from "@/shared/hooks/use-realtime-connection";

// 실시간 데이터 스토어
export {
  useRealtimeConnection as useRealtimeConnectionStore,
  useRealtimeDataStore,
  useRealtimeEconomicData,
  useRealtimeLeaderboard,
  useRealtimeMarketData,
  useRealtimeMoneyWave,
  useRealtimeNotifications,
  useRealtimePredictionGames,
} from "@/shared/stores/realtime-data-store";
export type {
  RealtimeDataState,
  RealtimeEconomicData,
  RealtimeMarketData,
  RealtimeMoneyWave,
  RealtimeNotification,
  RealtimePredictionGame,
} from "@/shared/stores/realtime-data-store";

// 실시간 프로바이더
export {
  RealtimeProvider,
  useRealtimeActions,
  useRealtimeContext,
  useRealtimeStatus,
} from "@/shared/providers/realtime-provider";

// 실시간 알림 시스템
export {
  NotificationBadge,
  NotificationCenter,
  NotificationToast,
  NotificationToasts,
  RealtimeNotificationSystem,
  RealtimeStatusIndicator,
} from "@/shared/components/realtime/notification-system";

// 실시간 차트 시스템
export {
  RealtimeDashboard,
  RealtimeEconomicTrendChart,
  RealtimeMarketDataChart,
  RealtimeMoneyWaveChart,
  RealtimePredictionGamesChart,
} from "@/shared/components/realtime/realtime-charts";

// 실시간 시스템 설정
export const REALTIME_CONFIG = {
  // WebSocket 설정
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,

  // 데이터 업데이트 설정
  MAX_HISTORICAL_POINTS: 20,
  MAX_NOTIFICATIONS: 50,
  AUTO_HIDE_DURATION: 3000,

  // 차트 업데이트 설정
  CHART_UPDATE_INTERVAL: 1000,
  ANIMATION_DURATION: 500,
} as const;

// 실시간 이벤트 타입
export const REALTIME_EVENTS = {
  // 연결 관련
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  AUTH: "auth",
  HEARTBEAT: "heartbeat",

  // 데이터 업데이트
  PREDICTION_GAME_UPDATE: "prediction_game_update",
  ECONOMIC_DATA_UPDATE: "economic_data_update",
  MONEY_WAVE_UPDATE: "money_wave_update",
  MARKET_DATA_UPDATE: "market_data_update",
  LEADERBOARD_UPDATE: "leaderboard_update",

  // 알림
  USER_NOTIFICATION: "user_notification",
  SYSTEM_NOTIFICATION: "system_notification",

  // 요청
  REQUEST_INITIAL_DATA: "request_initial_data",
  REQUEST_ACTIVE_GAMES: "request_active_games",
  REQUEST_LEADERBOARD: "request_leaderboard",
} as const;

// 유틸리티 함수들
export const realtimeUtils = {
  /**
   * 실시간 연결 상태를 확인합니다
   */
  isConnected: (state: any) => state?.status === "connected",

  /**
   * 알림 우선순위를 계산합니다
   */
  getNotificationPriority: (type: string) => {
    switch (type) {
      case "error":
        return 1;
      case "warning":
        return 2;
      case "success":
        return 3;
      default:
        return 4;
    }
  },

  /**
   * 차트 데이터를 정규화합니다
   */
  normalizeChartData: (data: any[], maxPoints: number = 20) => {
    return data.slice(-maxPoints);
  },

  /**
   * 시간 형식을 포맷팅합니다
   */
  formatTime: (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  },

  /**
   * 통화 형식을 포맷팅합니다
   */
  formatCurrency: (amount: number, currency: "PMP" | "PMC" | "KRW" = "KRW") => {
    const formatted = amount.toLocaleString("ko-KR");
    switch (currency) {
      case "PMP":
        return `${formatted} PMP`;
      case "PMC":
        return `${formatted} PMC`;
      default:
        return `₩${formatted}`;
    }
  },

  /**
   * 긴급도 레벨을 계산합니다
   */
  calculateUrgencyLevel: (timeRemaining: number): "low" | "medium" | "high" => {
    if (timeRemaining < 300) return "high"; // 5분 미만
    if (timeRemaining < 900) return "medium"; // 15분 미만
    return "low";
  },
};
