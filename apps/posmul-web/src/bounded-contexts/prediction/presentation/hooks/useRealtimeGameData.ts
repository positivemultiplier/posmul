"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface GameUpdateData {
  gameId: string;
  type:
    | "PROBABILITY_UPDATE"
    | "NEW_BET"
    | "PARTICIPANT_JOIN"
    | "GAME_STATUS_CHANGE"
    | "PRIZE_POOL_UPDATE";
  timestamp: string;
  data: {
    gameId: string;
    probabilities?: Record<string, number>;
    totalStaked?: number;
    participantCount?: number;
    status?: string;
    prizePool?: number;
    newBet?: {
      userId: string;
      amount: number;
      option: string;
    };
  };
}

export interface UseRealtimeGameDataProps {
  gameIds?: string[];
  category?: string;
  userId?: string;
  autoConnect?: boolean;
}

export interface RealtimeGameData {
  [gameId: string]: {
    probabilities: Record<string, number>;
    totalStaked: number;
    participantCount: number;
    status: string;
    prizePool: number;
    lastUpdate: string;
    recentBets: Array<{
      userId: string;
      amount: number;
      option: string;
      timestamp: string;
    }>;
  };
}

export function useRealtimeGameData({
  gameIds = [],
  category,
  userId,
  autoConnect = true,
}: UseRealtimeGameDataProps = {}) {
  const [gameData, setGameData] = useState<RealtimeGameData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  const supabase = createClientComponentClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 게임 데이터 업데이트 처리
  const handleGameUpdate = useCallback((update: GameUpdateData) => {
    setGameData((prev) => {
      const { gameId, type, data } = update;
      const currentGameData = prev[gameId] || {
        probabilities: {},
        totalStaked: 0,
        participantCount: 0,
        status: "ACTIVE",
        prizePool: 0,
        lastUpdate: new Date().toISOString(),
        recentBets: [],
      };

      const updatedGameData = { ...currentGameData };

      switch (type) {
        case "PROBABILITY_UPDATE":
          updatedGameData.probabilities = {
            ...updatedGameData.probabilities,
            ...data.probabilities,
          };
          break;

        case "NEW_BET":
          if (data.newBet) {
            updatedGameData.recentBets = [
              {
                ...data.newBet,
                timestamp: update.timestamp,
              },
              ...updatedGameData.recentBets.slice(0, 9), // 최근 10개만 유지
            ];
            updatedGameData.totalStaked =
              data.totalStaked || updatedGameData.totalStaked;
            updatedGameData.participantCount =
              data.participantCount || updatedGameData.participantCount;
          }
          break;

        case "PARTICIPANT_JOIN":
          updatedGameData.participantCount =
            data.participantCount || updatedGameData.participantCount;
          break;

        case "GAME_STATUS_CHANGE":
          updatedGameData.status = data.status || updatedGameData.status;
          break;

        case "PRIZE_POOL_UPDATE":
          updatedGameData.prizePool =
            data.prizePool || updatedGameData.prizePool;
          break;
      }

      updatedGameData.lastUpdate = update.timestamp;

      return {
        ...prev,
        [gameId]: updatedGameData,
      };
    });

    setUpdateCount((prev) => prev + 1);
  }, []);

  // WebSocket 연결 설정
  const connectToRealtimeUpdates = useCallback(async () => {
    if (!autoConnect || isConnected) return;

    setIsLoading(true);
    setConnectionError(null);

    try {
      // 기존 채널이 있으면 정리
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // 새 채널 생성
      const channel = supabase
        .channel("prediction_games_updates", {
          config: {
            broadcast: { self: true },
            presence: { key: userId || "anonymous" },
          },
        })
        .on(
          "broadcast",
          { event: "game_update" },
          (payload: { payload: GameUpdateData }) => {
            handleGameUpdate(payload.payload);
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("Realtime presence synced");
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setIsLoading(false);
            reconnectAttemptsRef.current = 0;
            console.log("✅ 실시간 업데이트 연결 완료");
          } else if (status === "CHANNEL_ERROR") {
            setConnectionError("채널 연결 오류");
            setIsLoading(false);
            attemptReconnect();
          } else if (status === "TIMED_OUT") {
            setConnectionError("연결 시간 초과");
            setIsLoading(false);
            attemptReconnect();
          } else if (status === "CLOSED") {
            setIsConnected(false);
            setIsLoading(false);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("실시간 연결 오류:", error);
      setConnectionError("연결 실패");
      setIsLoading(false);
      attemptReconnect();
    }
  }, [autoConnect, isConnected, userId, supabase, handleGameUpdate]);

  // 재연결 시도
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setConnectionError("최대 재연결 시도 초과");
      return;
    }

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      10000
    );
    reconnectAttemptsRef.current += 1;

    console.log(
      `🔄 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts} (${delay}ms 후)`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setIsConnected(false);
      connectToRealtimeUpdates();
    }, delay);
  }, [connectToRealtimeUpdates]);

  // 연결 해제
  const disconnect = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
    setIsLoading(false);
    setConnectionError(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [supabase]);

  // 수동 연결
  const connect = useCallback(() => {
    if (!isConnected) {
      connectToRealtimeUpdates();
    }
  }, [connectToRealtimeUpdates, isConnected]);

  // 특정 게임의 실시간 업데이트 요청
  const requestGameUpdate = useCallback(
    async (gameId: string) => {
      if (!isConnected || !channelRef.current) {
        console.warn("실시간 연결이 활성화되지 않음");
        return;
      }

      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "request_game_update",
          payload: { gameId, requesterId: userId },
        });
      } catch (error) {
        console.error("게임 업데이트 요청 오류:", error);
      }
    },
    [isConnected, userId]
  );

  // 게임 데이터 초기화
  const clearGameData = useCallback((gameId?: string) => {
    if (gameId) {
      setGameData((prev) => {
        const updated = { ...prev };
        delete updated[gameId];
        return updated;
      });
    } else {
      setGameData({});
    }
  }, []);

  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    if (autoConnect) {
      connectToRealtimeUpdates();
    }

    return () => {
      disconnect();
    };
  }, [connectToRealtimeUpdates, disconnect, autoConnect]);

  // 게임 ID 변경 시 처리
  useEffect(() => {
    if (gameIds.length > 0 && isConnected) {
      // 새로운 게임들에 대한 초기 데이터 요청
      gameIds.forEach((gameId) => {
        if (!gameData[gameId]) {
          requestGameUpdate(gameId);
        }
      });
    }
  }, [gameIds, isConnected, gameData, requestGameUpdate]);

  return {
    // 상태
    gameData,
    isConnected,
    isLoading,
    connectionError,
    updateCount,

    // 액션
    connect,
    disconnect,
    requestGameUpdate,
    clearGameData,

    // 유틸리티
    getGameData: (gameId: string) => gameData[gameId],
    hasGameData: (gameId: string) => !!gameData[gameId],
    getRecentBets: (gameId: string) => gameData[gameId]?.recentBets || [],
    getTotalStaked: (gameId: string) => gameData[gameId]?.totalStaked || 0,
    getParticipantCount: (gameId: string) =>
      gameData[gameId]?.participantCount || 0,
    getProbabilities: (gameId: string) => gameData[gameId]?.probabilities || {},
  };
}

export default useRealtimeGameData;
