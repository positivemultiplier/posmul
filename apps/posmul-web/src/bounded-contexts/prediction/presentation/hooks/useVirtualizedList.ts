"use client";

import { useCallback, useMemo, useState } from "react";

export const useVirtualizedList = ({
  initialData = [],
  pageSize = 10,
  loadData = null,
}) => {
  const [games, setGames] = useState(initialData);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [error, setError] = useState(null);

  // 다음 페이지 로드 함수
  const loadNextPage = useCallback(
    async (_startIndex, _stopIndex) => {
      if (isNextPageLoading || !hasNextPage) return;

      setIsNextPageLoading(true);
      setError(null);

      try {
        const currentPage = Math.floor(games.length / pageSize);
        const nextPage = currentPage + 1;

        // 실제 API 호출 대신 mock 데이터 사용
        if (loadData) {
          const newData = await loadData(nextPage, pageSize);

          if (newData && newData.length > 0) {
            setGames((prevGames) => [...prevGames, ...newData]);

            // 더 이상 데이터가 없으면 hasNextPage를 false로 설정
            if (newData.length < pageSize) {
              setHasNextPage(false);
            }
          } else {
            setHasNextPage(false);
          }
        } else {
          // Mock 데이터 생성
          const mockData = generateMockGames(nextPage, pageSize);

          if (mockData.length > 0) {
            setGames((prevGames) => [...prevGames, ...mockData]);
          }

          // 5페이지 후에는 더 이상 데이터가 없다고 가정
          if (nextPage >= 5) {
            setHasNextPage(false);
          }
        }
      } catch (err) {
        setError(err);
        // 에러 로깅은 실제 환경에서 적절한 로깅 시스템으로 교체
      } finally {
        setIsNextPageLoading(false);
      }
    },
    [games.length, pageSize, isNextPageLoading, hasNextPage, loadData]
  );

  // 게임 리스트 초기화
  const resetList = useCallback(() => {
    setGames(initialData);
    setHasNextPage(true);
    setIsNextPageLoading(false);
    setError(null);
  }, [initialData]);

  // 필터링된 게임 리스트
  const filteredGames = useMemo(() => {
    return games;
  }, [games]);

  return {
    games: filteredGames,
    hasNextPage,
    isNextPageLoading,
    error,
    loadNextPage,
    resetList,
    totalCount: games.length,
  };
};

// Mock 데이터 생성 함수
const generateMockGames = (page, pageSize) => {
  const games = [];
  const categories = ["스포츠", "정치", "경제", "기술", "엔터테인먼트"];
  const statuses = ["active", "pending", "ended"];

  for (let i = 0; i < pageSize; i++) {
    const gameIndex = (page - 1) * pageSize + i;
    const category = categories[gameIndex % categories.length];
    const status = statuses[gameIndex % statuses.length];

    games.push({
      id: `game-${gameIndex + 1}`,
      title: `${category} 예측 게임 #${gameIndex + 1}`,
      description: `${category} 분야의 흥미진진한 예측 게임입니다. 여러분의 예측 실력을 테스트해보세요!`,
      predictionType: gameIndex % 2 === 0 ? "binary" : "ranking",
      options: generateMockOptions(gameIndex),
      endTime: new Date(
        Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status,
      totalPool: Math.floor(Math.random() * 1000000) + 100000,
      totalParticipants: Math.floor(Math.random() * 500) + 50,
      gameImportanceScore: Math.floor(Math.random() * 5) + 5,
      category,
    });
  }

  return games;
};

const generateMockOptions = (gameIndex) => {
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const trends = ["up", "down", "stable"];

  if (gameIndex % 2 === 0) {
    // Binary 옵션
    return [
      {
        id: "1",
        text: "예",
        probability: Math.floor(Math.random() * 40) + 30,
        color: colors[0],
        totalBets: Math.floor(Math.random() * 500000) + 100000,
        participantCount: Math.floor(Math.random() * 200) + 50,
        trend: trends[gameIndex % 3],
      },
      {
        id: "2",
        text: "아니오",
        probability: Math.floor(Math.random() * 40) + 30,
        color: colors[1],
        totalBets: Math.floor(Math.random() * 500000) + 100000,
        participantCount: Math.floor(Math.random() * 200) + 50,
        trend: trends[(gameIndex + 1) % 3],
      },
    ];
  } else {
    // Multiple 옵션
    return [
      {
        id: "1",
        text: "옵션 A",
        probability: Math.floor(Math.random() * 30) + 20,
        color: colors[0],
        totalBets: Math.floor(Math.random() * 300000) + 50000,
        participantCount: Math.floor(Math.random() * 100) + 30,
        trend: trends[gameIndex % 3],
      },
      {
        id: "2",
        text: "옵션 B",
        probability: Math.floor(Math.random() * 30) + 20,
        color: colors[1],
        totalBets: Math.floor(Math.random() * 300000) + 50000,
        participantCount: Math.floor(Math.random() * 100) + 30,
        trend: trends[(gameIndex + 1) % 3],
      },
      {
        id: "3",
        text: "옵션 C",
        probability: Math.floor(Math.random() * 30) + 20,
        color: colors[2],
        totalBets: Math.floor(Math.random() * 300000) + 50000,
        participantCount: Math.floor(Math.random() * 100) + 30,
        trend: trends[(gameIndex + 2) % 3],
      },
    ];
  }
};
