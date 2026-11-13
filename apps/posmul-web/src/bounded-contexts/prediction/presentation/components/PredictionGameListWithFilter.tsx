"use client";

import { useState } from 'react';
import { PredictionGameCard } from './PredictionGameCard';
import { PredictionGameFilter } from './filters/PredictionGameFilter';
import { usePredictionFilters } from '../hooks/usePredictionFilters';
import { Button } from '../../../../shared/ui/components/base';

// Mock data with categories added
const mockGames = [
  {
    id: "1",
    title: "2024년 한국 GDP 성장률 예측",
    description: "올해 한국의 실질 GDP 성장률이 몇 %가 될지 예측해보세요.",
    category: "economy",
    predictionType: "ranking",
    options: [
      { id: "1", text: "2.0% 미만", currentOdds: 0.25 },
      { id: "2", text: "2.0% - 2.5%", currentOdds: 0.45 },
      { id: "3", text: "2.5% - 3.0%", currentOdds: 0.25 },
      { id: "4", text: "3.0% 초과", currentOdds: 0.05 },
    ],
    startTime: new Date("2024-01-01"),
    endTime: new Date("2024-12-20"),
    settlementTime: new Date("2024-12-31"),
    minimumStake: 100,
    maximumStake: 5000,
    maxParticipants: 1000,
    currentParticipants: 234,
    status: "ACTIVE",
    totalStake: 125000,
    gameImportanceScore: 2.5,
    allocatedPrizePool: 150000,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    title: "프리미어리그 맨시티 vs 아스날 경기 결과",
    description: "오늘 밤 프리미어리그 빅 매치 결과를 예측해보세요!",
    category: "sports",
    predictionType: "wdl",
    options: [
      { id: "1", text: "맨시티 승", currentOdds: 0.45 },
      { id: "2", text: "무승부", currentOdds: 0.25 },
      { id: "3", text: "아스날 승", currentOdds: 0.30 },
    ],
    startTime: new Date("2024-01-15"),
    endTime: new Date("2024-01-16T20:00:00"),
    settlementTime: new Date("2024-01-16T22:00:00"),
    minimumStake: 50,
    maximumStake: 2000,
    maxParticipants: 500,
    currentParticipants: 387,
    status: "ACTIVE",
    totalStake: 45000,
    gameImportanceScore: 1.8,
    allocatedPrizePool: 50000,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    title: "2024 대선 후보 지지율 1위 예측",
    description: "다음 대선에서 가장 높은 지지율을 받을 후보를 예측해보세요.",
    category: "politics",
    predictionType: "ranking",
    options: [
      { id: "1", text: "후보 A", currentOdds: 0.35 },
      { id: "2", text: "후보 B", currentOdds: 0.30 },
      { id: "3", text: "후보 C", currentOdds: 0.25 },
      { id: "4", text: "기타", currentOdds: 0.10 },
    ],
    startTime: new Date("2024-01-01"),
    endTime: new Date("2024-06-30"),
    settlementTime: new Date("2024-07-15"),
    minimumStake: 200,
    maximumStake: 10000,
    maxParticipants: 2000,
    currentParticipants: 156,
    status: "PENDING",
    totalStake: 85000,
    gameImportanceScore: 3.0,
    allocatedPrizePool: 100000,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "4",
    title: "BTS 새 앨범 빌보드 차트 순위",
    description: "BTS의 새 앨범이 빌보드 200에서 몇 위를 기록할지 예측해보세요!",
    category: "entertainment",
    predictionType: "ranking",
    options: [
      { id: "1", text: "1위", currentOdds: 0.70 },
      { id: "2", text: "2-5위", currentOdds: 0.20 },
      { id: "3", text: "6-10위", currentOdds: 0.08 },
      { id: "4", text: "11위 이하", currentOdds: 0.02 },
    ],
    startTime: new Date("2024-02-01"),
    endTime: new Date("2024-02-14"),
    settlementTime: new Date("2024-02-21"),
    minimumStake: 25,
    maximumStake: 1000,
    maxParticipants: 800,
    currentParticipants: 645,
    status: "ENDED",
    totalStake: 32000,
    gameImportanceScore: 1.5,
    allocatedPrizePool: 35000,
    createdAt: new Date("2024-02-01"),
  }
];

export const PredictionGameListWithFilter = ({ userId }) => {
  const [sortOption, setSortOption] = useState('latest');

  const {
    filteredGames,
    handleFilterChange,
    resetFilters,
    totalCount,
    filteredCount
  } = usePredictionFilters(mockGames);

  // 정렬 적용
  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortOption) {
      case 'popularity':
        return b.currentParticipants - a.currentParticipants;
      case 'stake':
        return b.totalStake - a.totalStake;
      case 'ending':
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      case 'latest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎯 예측 게임</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          다양한 분야의 예측 게임에 참여하고 PMP를 획득하세요!
        </p>
      </div>

      {/* 필터 컴포넌트 */}
      <PredictionGameFilter
        onFilterChange={handleFilterChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* 정렬 옵션 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">정렬:</span>
          <div className="flex gap-2">
            {[
              { id: 'latest', label: '최신순' },
              { id: 'popularity', label: '인기순' },
              { id: 'stake', label: '참여 PMP순' },
              { id: 'ending', label: '마감임박순' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSortOption(option.id)}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  sortOption === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 뷰 옵션 */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            🔲 그리드
          </Button>
          <Button variant="ghost" size="sm">
            📋 리스트
          </Button>
        </div>
      </div>

      {/* 게임 카드 그리드 */}
      {sortedGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGames.map((game) => (
            <PredictionGameCard
              key={game.id}
              game={game}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            조건에 맞는 게임을 찾을 수 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            필터 조건을 조정하거나 초기화해보세요
          </p>
          <Button onClick={resetFilters} variant="outline">
            필터 초기화
          </Button>
        </div>
      )}

      {/* 무한 스크롤을 위한 로딩 영역 (추후 구현) */}
      <div className="text-center py-8">
        <Button variant="outline" className="text-gray-500">
          더 많은 게임 보기
        </Button>
      </div>
    </div>
  );
};
