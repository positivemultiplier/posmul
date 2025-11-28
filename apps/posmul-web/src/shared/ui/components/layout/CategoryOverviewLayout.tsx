/**
 * CategoryOverviewLayout - 카테고리 개요 레이아웃 (UnifiedGameCard 사용)
 */
import React from "react";

import { Card } from "../base";
import { UnifiedGameCard, type GameCardProps } from "../games/UnifiedGameCard";

export interface CategoryStatistics {
  totalGames?: number;
  activeGames?: number;
  totalParticipants?: number;
  totalStaked?: number;
  totalRewardPool?: number;
  subcategoryCount?: number; // 추가 필드
}

export interface PopularSubcategory {
  id?: string;
  name?: string;
  title?: string; // 추가 필드
  slug?: string;
  icon?: string; // 추가 필드
  gameCount?: number;
  participantCount?: number; // 추가 필드
  rank?: number; // 추가 필드
  description?: string;
}

// GameCardProps는 UnifiedGameCard에서 export하므로 re-export
export type { GameCardProps } from "../games/UnifiedGameCard";

interface CategoryOverviewLayoutProps {
  category: string;
  title: string;
  description: string;
  icon: string;
  statistics: CategoryStatistics;
  popularSubcategories?: PopularSubcategory[];
  games: GameCardProps[];
  showPopularSection?: boolean;
  maxGamesDisplay?: number;
  userId?: string; // 추가: 사용자 ID
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
  }>;
}

export function CategoryOverviewLayout({
  category,
  title,
  description,
  icon,
  statistics,
  popularSubcategories = [],
  games,
  showPopularSection = true,
  maxGamesDisplay = 6,
  userId, // 추가
  LinkComponent = ({ href, children }) => <a href={href}>{children}</a>,
}: CategoryOverviewLayoutProps) {
  const displayGames = games.slice(0, maxGamesDisplay);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{description}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {statistics.totalGames}
          </div>
          <div className="text-sm text-gray-600">전체 게임</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {statistics.activeGames}
          </div>
          <div className="text-sm text-gray-600">진행 중</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {statistics.totalParticipants}
          </div>
          <div className="text-sm text-gray-600">참여자</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {statistics.totalStaked}
          </div>
          <div className="text-sm text-gray-600">총 스테이킹</div>
        </Card>
      </div>

      {/* Popular Subcategories */}
      {showPopularSection && popularSubcategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            인기 하위 카테고리
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularSubcategories.map((subcategory, index) => (
              <LinkComponent
                key={subcategory.slug || subcategory.id || index}
                href={`/${category}/${subcategory.slug || subcategory.id || ""}`}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {subcategory.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {subcategory.description || ""}
                  </p>
                  <div className="text-blue-600 text-sm font-medium">
                    {subcategory.gameCount}개 게임
                  </div>
                </Card>
              </LinkComponent>
            ))}
          </div>
        </div>
      )}

      {/* Games - UnifiedGameCard 사용 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">최신 게임</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGames.map((game) => (
            <UnifiedGameCard
              key={game.id}
              game={game}
              userId={userId}
              LinkComponent={LinkComponent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// UnifiedGameCard를 사용하므로 기존 GameCard 제거됨
