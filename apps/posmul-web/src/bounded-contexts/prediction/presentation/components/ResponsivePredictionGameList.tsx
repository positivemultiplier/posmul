"use client";

import { useState } from "react";
import { Button } from "../../../../shared/ui/components/base";
import { PredictionGameCard } from "./PredictionGameCard";
import { MobilePredictionCard } from "./mobile/MobilePredictionCard";
import { MobileGameNavigation } from "./mobile/MobileGameNavigation";
import { MobileBettingSheet } from "./mobile/MobileBettingSheet";
import { useIsMobile } from "../utils/mobileHelpers";
import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";

const mockGames = [
  {
    id: "1",
    title: "2024년 한국 GDP 성장률 예측",
    description: "올해 한국의 실질 GDP 성장률이 몇 %가 될지 예측해보세요.",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "1", text: "2.0% 미만", currentOdds: 1.25 },
      { id: "2", text: "2.0% - 2.5%", currentOdds: 1.45 },
      { id: "3", text: "2.5% - 3.0%", currentOdds: 1.25 },
      { id: "4", text: "3.0% 초과", currentOdds: 1.05 },
    ],
    startTime: new Date("2024-01-01T00:00:00Z"),
    endTime: new Date("2024-12-20T23:59:59Z"),
    settlementTime: new Date("2024-12-31T23:59:59Z"),
    minimumStake: 1000,
    maximumStake: 100000,
    maxParticipants: 1000,
    currentParticipants: 366,
    status: GameStatus.ACTIVE,
    totalStake: 730000,
    gameImportanceScore: 8.5,
    allocatedPrizePool: 800000,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    id: "2",
    title: "2024 미국 대선 결과",
    description: "누가 차기 미국 대통령이 될까요?",
    predictionType: PredictionType.BINARY,
    options: [
      { id: "1", text: "민주당 승리", currentOdds: 1.52 },
      { id: "2", text: "공화당 승리", currentOdds: 1.48 }
    ],
    startTime: new Date("2024-01-01T00:00:00Z"),
    endTime: new Date("2024-11-05T08:00:00Z"),
    settlementTime: new Date("2024-11-06T08:00:00Z"),
    minimumStake: 1000,
    maximumStake: 500000,
    maxParticipants: 2000,
    currentParticipants: 443,
    status: GameStatus.ACTIVE,
    totalStake: 2230000,
    gameImportanceScore: 9.8,
    allocatedPrizePool: 2500000,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    id: "3",
    title: "BTC 가격 예측 (연말)",
    description: "2024년 12월 31일 비트코인 가격을 예측해보세요.",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "1", text: "$40,000 미만", currentOdds: 1.15 },
      { id: "2", text: "$40,000 - $60,000", currentOdds: 1.35 },
      { id: "3", text: "$60,000 - $80,000", currentOdds: 1.30 },
      { id: "4", text: "$80,000 초과", currentOdds: 1.20 },
    ],
    startTime: new Date("2024-01-01T00:00:00Z"),
    endTime: new Date("2024-12-31T23:59:59Z"),
    settlementTime: new Date("2025-01-01T00:00:00Z"),
    minimumStake: 1000,
    maximumStake: 200000,
    maxParticipants: 500,
    currentParticipants: 324,
    status: GameStatus.ACTIVE,
    totalStake: 677000,
    gameImportanceScore: 7.2,
    allocatedPrizePool: 750000,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  }
];

export const PredictionGameList: React.FC<{ userId?: string }> = ({
  userId: _userId,
}) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedGame, setSelectedGame] = useState(null);
  const [isBettingSheetOpen, setIsBettingSheetOpen] = useState(false);

  const handleBetClick = (game) => {
    setSelectedGame(game);
    setIsBettingSheetOpen(true);
  };

  const handleDetailsClick = (_game) => {
    // 상세 페이지로 이동 로직 추가 예정
  };

  const handleSubmitBet = (_betData) => {
    // 베팅 제출 로직 추가 예정
    setIsBettingSheetOpen(false);
  };

  const filteredGames = mockGames.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileGameNavigation
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFilterToggle={() => {/* 필터 토글 로직 추가 예정 */}}
          filterCount={0}
        />

        <div className="p-4 space-y-3">
          {filteredGames.map((game) => (
            <MobilePredictionCard
              key={game.id}
              game={game}
              onBetClick={handleBetClick}
              onDetailsClick={handleDetailsClick}
            />
          ))}
        </div>

        <MobileBettingSheet
          isOpen={isBettingSheetOpen}
          onClose={() => setIsBettingSheetOpen(false)}
          gameData={selectedGame}
          onSubmitBet={handleSubmitBet}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">예측 게임</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="게임 검색..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button variant="outline">필터</Button>
        </div>
      </div>

      <div className={`
        grid gap-6
        ${viewMode === 'grid'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1'
        }
      `}>
        {filteredGames.map((game) => (
          <PredictionGameCard
            key={game.id}
            game={game}
            onBetClick={handleBetClick}
            onDetailsClick={handleDetailsClick}
            className={viewMode === 'list' ? 'md:flex md:space-x-4' : ''}
          />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
