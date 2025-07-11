/**
 * CategoryOverviewLayout - 카테고리 개요 레이아웃 (간소화 버전)
 */

import React from 'react';
import { Card } from '../base';

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

export interface GameCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  endTime: string;
  totalStaked?: number;
  participants: number;
  options: {
    id: string;
    title?: string;
    label?: string;
    percentage?: number;
    probability?: number;
    odds?: number;
  }[];
  // 추가 필드들도 선택적으로 지원
  gameType?: string;
  status?: string;
  difficulty?: string;
  maxParticipants?: number;
  totalStake?: number;
  minStake?: number;
  maxStake?: number;
  expectedReturn?: number;
  href?: string;
  moneyWave?: {
    allocatedPool?: number;
    currentPool?: number;
    waveMultiplier?: number;
    distributionDate?: string;
  };
  imagePlaceholder?: string;
  tags?: string[];
  isHot?: boolean;
  isFeatured?: boolean;
}

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
  LinkComponent?: React.ComponentType<{ href: string; children: React.ReactNode }>;
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
          <div className="text-3xl font-bold text-blue-600">{statistics.totalGames}</div>
          <div className="text-sm text-gray-600">전체 게임</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{statistics.activeGames}</div>
          <div className="text-sm text-gray-600">진행 중</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{statistics.totalParticipants}</div>
          <div className="text-sm text-gray-600">참여자</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{statistics.totalStaked}</div>
          <div className="text-sm text-gray-600">총 스테이킹</div>
        </Card>
      </div>

      {/* Popular Subcategories */}
      {showPopularSection && popularSubcategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">인기 하위 카테고리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularSubcategories.map((subcategory) => (
              <LinkComponent key={subcategory.slug} href={`/${category}/${subcategory.slug}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {subcategory.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {subcategory.description || ''}
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

      {/* Games */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">최신 게임</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGames.map((game) => (
            <GameCard key={game.id} {...game} LinkComponent={LinkComponent} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function GameCard({
  id,
  title,
  description,
  category,
  endTime,
  totalStaked,
  participants,
  options,
  LinkComponent = ({ href, children }) => <a href={href}>{children}</a>
}: GameCardProps & { LinkComponent?: React.ComponentType<{ href: string; children: React.ReactNode }> }) {
  return (
    <LinkComponent href={`/prediction/${category}/${id}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

        <div className="space-y-2 mb-4">
          {options.slice(0, 2).map((option) => (
            <div key={option.id} className="flex justify-between items-center">
              <span className="text-sm text-gray-700">{option.title}</span>
              <span className="text-sm font-medium text-blue-600">{option.percentage}%</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>참여자 {participants}명</div>
          <div>{totalStaked} PmpAmount</div>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          종료: {new Date(endTime).toLocaleDateString()}
        </div>
      </Card>
    </LinkComponent>
  );
}
