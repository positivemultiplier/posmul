"use client";

import { isFailure } from "@posmul/auth-economy-sdk";

import React, { createContext, useContext, useEffect, useRef } from "react";

import { useRealtimeConnection } from "../hooks/use-realtime-connection";
import type {
  RealtimeEconomicData,
  RealtimeMarketData,
  RealtimeMoneyWave,
  RealtimePredictionGame,
} from "../stores/realtime-data-store";
import { useRealtimeDataStore } from "../stores/realtime-data-store";

interface RealtimeProviderProps {
  children: React.ReactNode;
  userId?: string;
  wsUrl?: string;
  debug?: boolean;
}

interface RealtimeContextValue {
  isConnected: boolean;
  connectionError: string | null;
  lastConnected: Date | null;
  reconnect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({
  children,
  userId,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  debug = false,
}: RealtimeProviderProps) {
  const store = useRealtimeDataStore();
  const subscribedRef = useRef(false);

  const { connectionState, sendMessage, subscribe, connect, disconnect } =
    useRealtimeConnection({
      url: wsUrl,
      debug,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
    });

  // 연결 상태를 스토어에 동기화
  useEffect(() => {
    store.setConnection(
      connectionState.status === "connected",
      connectionState.error
    );
  }, [connectionState.status, connectionState.error, store]);

  // 실시간 데이터 구독 설정
  useEffect(() => {
    if (connectionState.status === "connected" && !subscribedRef.current) {
      subscribedRef.current = true;

      // 사용자 인증 메시지 전송
      if (userId) {
        sendMessage("auth", { userId });
      }

      // 예측 게임 업데이트 구독
      const unsubscribePredictionGames = subscribe(
        "prediction_game_update",
        (data: RealtimePredictionGame) => {
          store.updatePredictionGame({
            ...data,
            lastUpdate: new Date(),
          });
        }
      );

      // 경제 데이터 업데이트 구독
      const unsubscribeEconomicData = subscribe(
        "economic_data_update",
        (data: RealtimeEconomicData) => {
          store.updateEconomicData({
            ...data,
            lastUpdate: new Date(),
          });
        }
      );

      // MoneyWave 업데이트 구독
      const unsubscribeMoneyWave = subscribe(
        "money_wave_update",
        (data: RealtimeMoneyWave) => {
          store.updateMoneyWave({
            ...data,
            lastUpdate: new Date(),
          });
        }
      );

      // 시장 데이터 업데이트 구독
      const unsubscribeMarketData = subscribe(
        "market_data_update",
        (data: RealtimeMarketData) => {
          store.updateMarketData({
            ...data,
            lastUpdate: new Date(),
          });
        }
      );

      // 리더보드 업데이트 구독
      const unsubscribeLeaderboard = subscribe(
        "leaderboard_update",
        (data: any) => {
          store.updateLeaderboard(data.leaderboard || []);
        }
      );

      // 사용자별 알림 구독
      const unsubscribeNotifications = subscribe(
        "user_notification",
        (data: any) => {
          store.addNotification({
            type: data.type || "info",
            title: data.title || "알림",
            message: data.message || "",
            read: false,
            autoHide: data.autoHide,
            duration: data.duration,
          });
        }
      );

      // 시스템 알림 구독
      const unsubscribeSystemNotifications = subscribe(
        "system_notification",
        (data: any) => {
          store.addNotification({
            type: data.type || "info",
            title: data.title || "시스템 알림",
            message: data.message || "",
            read: false,
            autoHide: data.autoHide,
            duration: data.duration,
          });
        }
      );

      // 정리 함수 반환
      return () => {
        unsubscribePredictionGames();
        unsubscribeEconomicData();
        unsubscribeMoneyWave();
        unsubscribeMarketData();
        unsubscribeLeaderboard();
        unsubscribeNotifications();
        unsubscribeSystemNotifications();
        subscribedRef.current = false;
      };
    }
  }, [connectionState.status, userId, sendMessage, subscribe, store]);

  // 연결 끊어질 때 구독 상태 리셋
  useEffect(() => {
    if (
      connectionState.status === "disconnected" ||
      connectionState.status === "error"
    ) {
      subscribedRef.current = false;
    }
  }, [connectionState.status]);

  // 초기 데이터 요청
  useEffect(() => {
    if (connectionState.status === "connected" && userId) {
      // 초기 데이터 요청
      sendMessage("request_initial_data", { userId });

      // 활성 게임 목록 요청
      sendMessage("request_active_games", {});

      // 리더보드 요청
      sendMessage("request_leaderboard", {});
    }
  }, [connectionState.status, userId, sendMessage]);

  const contextValue: RealtimeContextValue = {
    isConnected: connectionState.status === "connected",
    connectionError: connectionState.error || null,
    lastConnected: connectionState.lastConnected || null,
    reconnect: connect,
    disconnect,
  };

  if (debug) {
    console.log("[RealtimeProvider] Status:", connectionState.status);
    console.log("[RealtimeProvider] Subscribed:", subscribedRef.current);
    console.log("[RealtimeProvider] UserId:", userId);
  }

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error(
      "useRealtimeContext must be used within a RealtimeProvider"
    );
  }
  return context;
}

// 편의 훅들
export function useRealtimeStatus() {
  const context = useRealtimeContext();
  return {
    isConnected: context.isConnected,
    connectionError: context.connectionError,
    lastConnected: context.lastConnected,
  };
}

export function useRealtimeActions() {
  const context = useRealtimeContext();
  return {
    reconnect: context.reconnect,
    disconnect: context.disconnect,
  };
}
