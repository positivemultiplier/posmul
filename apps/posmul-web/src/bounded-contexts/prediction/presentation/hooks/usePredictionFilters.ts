"use client";

import { useCallback, useMemo, useState } from "react";

// 개별 필터 검증 함수들
const matchesSearchFilter = (game, search) => {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  return (
    game.title.toLowerCase().includes(searchLower) ||
    game.description.toLowerCase().includes(searchLower)
  );
};

const matchesCategoryFilter = (game, categories) => {
  if (categories.length === 0) return true;
  const gameCategory = game.category || "economy";
  return categories.includes(gameCategory);
};

const matchesStatusFilter = (game, statuses) => {
  if (statuses.length === 0) return true;
  const gameStatus = game.status.toLowerCase();
  return statuses.includes(gameStatus);
};

const matchesStakeRangeFilter = (game, stakeRange) => {
  return (
    game.minimumStake >= stakeRange.min && game.minimumStake <= stakeRange.max
  );
};

const matchesTimeFilter = (game, timeFilter) => {
  if (timeFilter === "all") return true;

  const now = new Date();
  const endTime = new Date(game.endTime);
  const diffHours = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  switch (timeFilter) {
    case "1hour":
      return diffHours <= 1 && diffHours >= 0;
    case "today":
      return diffHours <= 24 && diffHours >= 0;
    case "week":
      return diffHours <= 168 && diffHours >= 0;
    default:
      return true;
  }
};

// 필터된 게임 리스트를 관리하는 커스텀 훅
export const usePredictionFilters = (games) => {
  const [filters, setFilters] = useState({
    search: "",
    categories: [],
    statuses: [],
    stakeRange: { min: 0, max: 10000 },
    timeFilter: "all",
  });

  // 필터 적용 로직
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      return (
        matchesSearchFilter(game, filters.search) &&
        matchesCategoryFilter(game, filters.categories) &&
        matchesStatusFilter(game, filters.statuses) &&
        matchesStakeRangeFilter(game, filters.stakeRange) &&
        matchesTimeFilter(game, filters.timeFilter)
      );
    });
  }, [games, filters]);

  // 필터 업데이트 함수
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      search: "",
      categories: [],
      statuses: [],
      stakeRange: { min: 0, max: 10000 },
      timeFilter: "all",
    };
    setFilters(defaultFilters);
  }, []);

  return {
    filteredGames,
    filters,
    handleFilterChange,
    resetFilters,
    totalCount: games.length,
    filteredCount: filteredGames.length,
  };
};
