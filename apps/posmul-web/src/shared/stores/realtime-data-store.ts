"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 실시간 데이터 타입 정의
export interface RealtimePredictionGame {
  gameId: string;
  title: string;
  status: "ACTIVE" | "ENDED" | "SETTLED";
  participantCount: number;
  totalStaked: number;
  endTime: string;
  currentOdds?: Record<string, number>;
  lastUpdate: Date;
}

export interface RealtimeEconomicData {
  userId: string;
  pmpBalance: number;
  pmcBalance: number;
  totalValue: number;
  lastUpdate: Date;
  recentTransactions: Array<{
    id: string;
    type:
      | "PmpAmount_EARNED"
      | "PmcAmount_EARNED"
      | "PmpAmount_SPENT"
      | "PmcAmount_SPENT";
    amount: number;
    timestamp: Date;
    source: string;
  }>;
}

export interface RealtimeMoneyWave {
  currentWave: number;
  currentHourPool: number;
  timeRemaining: number; // seconds
  participantsThisHour: number;
  distributedThisHour: number;
  nextHourPreview: number;
  urgencyLevel: "low" | "medium" | "high";
  lastUpdate: Date;
}

export interface RealtimeNotification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoHide?: boolean;
  duration?: number;
}

export interface RealtimeMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  trend: "UP" | "DOWN" | "STABLE";
  lastUpdate: Date;
}

export interface RealtimeDataState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  lastConnected: Date | null;

  // Prediction games
  activeGames: RealtimePredictionGame[];
  gameUpdates: Map<string, RealtimePredictionGame>;

  // Economic data
  economicData: RealtimeEconomicData | null;
  moneyWave: RealtimeMoneyWave | null;

  // Market data
  marketData: Map<string, RealtimeMarketData>;

  // Notifications
  notifications: RealtimeNotification[];
  unreadCount: number;

  // Leaderboard
  leaderboard: Array<{
    userId: string;
    username: string;
    totalWinnings: number;
    successRate: number;
    agencyScore: number;
    rank: number;
    lastUpdate: Date;
  }>;

  // Actions
  setConnection: (connected: boolean, error?: string) => void;
  updatePredictionGame: (game: RealtimePredictionGame) => void;
  updateEconomicData: (data: RealtimeEconomicData) => void;
  updateMoneyWave: (wave: RealtimeMoneyWave) => void;
  updateMarketData: (data: RealtimeMarketData) => void;
  addNotification: (
    notification: Omit<RealtimeNotification, "id" | "timestamp">
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateLeaderboard: (leaderboard: RealtimeDataState["leaderboard"]) => void;
  resetStore: () => void;
}

const initialState = {
  isConnected: false,
  connectionError: null,
  lastConnected: null,
  activeGames: [],
  gameUpdates: new Map(),
  economicData: null,
  moneyWave: null,
  marketData: new Map(),
  notifications: [],
  unreadCount: 0,
  leaderboard: [],
};

export const useRealtimeDataStore = create<RealtimeDataState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setConnection: (connected: boolean, error?: string) =>
      set({
        isConnected: connected,
        connectionError: error || null,
        lastConnected: connected ? new Date() : get().lastConnected,
      }),

    updatePredictionGame: (game: RealtimePredictionGame) =>
      set((state) => {
        const updatedGames = state.activeGames.filter(
          (g) => g.gameId !== game.gameId
        );
        updatedGames.push(game);

        const newGameUpdates = new Map(state.gameUpdates);
        newGameUpdates.set(game.gameId, game);

        return {
          activeGames: updatedGames.sort(
            (a, b) =>
              new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
          ),
          gameUpdates: newGameUpdates,
        };
      }),

    updateEconomicData: (data: RealtimeEconomicData) =>
      set((state) => {
        // 잔액 변화 알림 생성
        if (state.economicData) {
          const pmpChange = data.pmpBalance - state.economicData.pmpBalance;
          const pmcChange = data.pmcBalance - state.economicData.pmcBalance;

          if (pmpChange !== 0) {
            get().addNotification({
              type: pmpChange > 0 ? "success" : "info",
              title: "PmpAmount 잔액 변경",
              message: "Invalid state",
              read: false,
              autoHide: true,
              duration: 3000,
            });
          }

          if (pmcChange !== 0) {
            get().addNotification({
              type: pmcChange > 0 ? "success" : "info",
              title: "PmcAmount 잔액 변경",
              message: "Invalid state",
              read: false,
              autoHide: true,
              duration: 3000,
            });
          }
        }

        return { economicData: data };
      }),

    updateMoneyWave: (wave: RealtimeMoneyWave) =>
      set((state) => {
        // 긴급도 변화 알림
        if (
          state.moneyWave &&
          state.moneyWave.urgencyLevel !== wave.urgencyLevel
        ) {
          if (wave.urgencyLevel === "high") {
            get().addNotification({
              type: "warning",
              title: "🌊 MoneyWave 긴급",
              message: `이번 시간 분배 마감까지 ${Math.floor(
                wave.timeRemaining / 60
              )}분 남았습니다!`,
              read: false,
              autoHide: true,
              duration: 5000,
            });
          }
        }

        return { moneyWave: wave };
      }),

    updateMarketData: (data: RealtimeMarketData) =>
      set((state) => {
        const newMarketData = new Map(state.marketData);
        newMarketData.set(data.symbol, data);
        return { marketData: newMarketData };
      }),

    addNotification: (
      notification: Omit<RealtimeNotification, "id" | "timestamp">
    ) =>
      set((state) => {
        const newNotification: RealtimeNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };

        const newNotifications = [newNotification, ...state.notifications];

        // 최대 50개 알림만 유지
        if (newNotifications.length > 50) {
          newNotifications.splice(50);
        }

        return {
          notifications: newNotifications,
          unreadCount: state.unreadCount + 1,
        };
      }),

    markNotificationRead: (id: string) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),

    clearNotifications: () =>
      set({
        notifications: [],
        unreadCount: 0,
      }),

    updateLeaderboard: (leaderboard: RealtimeDataState["leaderboard"]) =>
      set({ leaderboard }),

    resetStore: () => set(initialState),
  }))
);

// 선택자 훅들
export const useRealtimeConnection = () =>
  useRealtimeDataStore((state) => ({
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    lastConnected: state.lastConnected,
  }));

export const useRealtimePredictionGames = () =>
  useRealtimeDataStore((state) => state.activeGames);

export const useRealtimeEconomicData = () =>
  useRealtimeDataStore((state) => state.economicData);

export const useRealtimeMoneyWave = () =>
  useRealtimeDataStore((state) => state.moneyWave);

export const useRealtimeNotifications = () =>
  useRealtimeDataStore((state) => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification: state.addNotification,
    markNotificationRead: state.markNotificationRead,
    clearNotifications: state.clearNotifications,
  }));

export const useRealtimeLeaderboard = () =>
  useRealtimeDataStore((state) => state.leaderboard);

export const useRealtimeMarketData = (symbol?: string) =>
  useRealtimeDataStore((state) =>
    symbol
      ? state.marketData.get(symbol)
      : Array.from(state.marketData.values())
  );
