"use client";

import { useState } from 'react';
import { VirtualizedPredictionList } from './virtualization/VirtualizedPredictionList';
import { useVirtualizedList } from '../hooks/useVirtualizedList';
import { useIsMobile } from '../utils/mobileHelpers';
import { Search, Filter, Grid, List } from 'lucide-react';

export const PredictionGameListWithVirtualization = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // 가상화된 리스트 훅 사용
  const {
    games,
    hasNextPage,
    isNextPageLoading,
    error,
    loadNextPage,
    resetList,
    totalCount
  } = useVirtualizedList({
    pageSize: 20,
    // loadData: async (page, size) => {
    //   // 실제 API 호출 로직
    //   const response = await fetch(`/api/prediction-games?page=${page}&size=${size}`);
    //   return response.json();
    // }
  });

  const handleGameSelect = (game) => {
    setSelectedGame(game);
  };

  const filteredGames = games.filter(game =>
    !searchQuery ||
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                예측 게임
              </h1>
              <div className="text-sm text-gray-500">
                총 {totalCount}개
              </div>
            </div>

            {!isMobile && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="게임 검색..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>필터</span>
                </button>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search */}
          {isMobile && (
            <div className="pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예측 게임 검색..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium">데이터 로딩 오류</h3>
            <p className="text-red-600 text-sm mt-1">
              게임 목록을 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              onClick={resetList}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Virtualized List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <VirtualizedPredictionList
            games={filteredGames}
            hasNextPage={hasNextPage}
            isNextPageLoading={isNextPageLoading}
            loadNextPage={loadNextPage}
            onGameSelect={handleGameSelect}
            itemHeight={isMobile ? 180 : 220}
            height={isMobile ? window.innerHeight - 200 : 600}
          />
        </div>

        {/* Selected Game Info */}
        {selectedGame && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900">선택된 게임</h3>
            <p className="text-blue-700 text-sm mt-1">
              {selectedGame.title}
            </p>
            <div className="flex space-x-2 mt-3">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                베팅하기
              </button>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded hover:bg-blue-50">
                상세 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
