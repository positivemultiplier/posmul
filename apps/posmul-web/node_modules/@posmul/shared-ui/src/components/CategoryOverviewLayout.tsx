/**
 * Category Overview Layout Component
 *
 * 모든 도메인([category])에서 재사용 가능한 공통 레이아웃
 * - MoneyWave 기반 통계 정보
 * - 인기 서브카테고리
 * - 실제 콘텐츠 리스트
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import type { ComponentType, HTMLAttributes } from "react";
import React from "react";
import {
  EnhancedGameCard,
  type EnhancedGameCardProps,
  type GameType,
} from "./EnhancedGameCard.js";
import { Badge } from "./ui/badge.js";
import { Card, CardContent } from "./ui/card.js";

// 공통 데이터 인터페이스
export interface CategoryStatistics {
  totalRewardPool: number; // MoneyWave 총 보상 풀
  totalParticipants: number; // 총 참여자
  activeGames: number; // 활성 예측 게임 수
  subcategoryCount: number; // 서브카테고리 수
}

export interface PopularSubcategory {
  id: string;
  title: string;
  icon: string;
  participantCount: number;
  rank: number;
}

// 게임 카드 Props (EnhancedGameCard와 호환)
export interface GameCardProps extends EnhancedGameCardProps {}

// Define a type for the Link component that can be passed as a prop.
// It should be able to accept props like href, children, and other anchor attributes.
type LinkProps = {
  href: string;
  children: React.ReactNode;
  [key: string]: any; // Allow other props
};

// Define the props for CategoryOverviewLayout
interface CategoryOverviewLayoutProps extends HTMLAttributes<HTMLDivElement> {
  // 페이지 기본 정보
  category: string;
  title: string;
  description: string;
  icon: string;

  // 통계 정보
  statistics: CategoryStatistics;

  // 인기 서브카테고리 (TOP 3)
  popularSubcategories: PopularSubcategory[];

  // 실제 게임/콘텐츠 리스트
  games: GameCardProps[];

  // 추가 설정
  showPopularSection?: boolean;
  maxGamesDisplay?: number;
  LinkComponent?: ComponentType<LinkProps>; // Optional custom Link component
}

// 통계 카드 컴포넌트
function StatisticsCard({
  icon,
  title,
  value,
  subtitle,
  color = "text-gray-900",
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  color?: string;
}) {
  return (
    <Card className="text-center hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="text-2xl mb-2">{icon}</div>
        <div className={`text-2xl font-bold ${color} mb-1`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

// 인기 서브카테고리 카드
function PopularSubcategoryCard({
  subcategory,
}: {
  subcategory: PopularSubcategory;
}) {
  const rankColors = {
    1: "bg-yellow-100 text-yellow-800 border-yellow-200",
    2: "bg-gray-100 text-gray-800 border-gray-200",
    3: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const rankColor =
    rankColors[subcategory.rank as keyof typeof rankColors] || rankColors[3];

  return (
    <Card
      className={`${rankColor} border-2 hover:shadow-lg transition-all duration-200`}
    >
      <CardContent className="p-4 text-center">
        <div className="text-3xl mb-2">{subcategory.icon}</div>
        <div className="font-semibold mb-1">{subcategory.title}</div>
        <div className="text-sm opacity-75">
          {subcategory.participantCount.toLocaleString()}명 참여
        </div>
        <Badge className="mt-2 bg-white/50">#{subcategory.rank}</Badge>
      </CardContent>
    </Card>
  );
}

// 메인 레이아웃 컴포넌트
export function CategoryOverviewLayout({
  category,
  title,
  description,
  icon,
  statistics,
  popularSubcategories,
  games,
  showPopularSection = true,
  maxGamesDisplay = 6,
  LinkComponent,
}: CategoryOverviewLayoutProps) {
  // 기본 LinkComponent (단순 앵커 태그) - 제공되지 않은 경우 사용
  const DefaultLink: ComponentType<LinkProps> = ({
    href,
    children,
    className,
    ...rest
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );

  const Link = LinkComponent ?? DefaultLink;

  const displayGames = games.slice(0, maxGamesDisplay);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center space-y-4">
        <div className="text-6xl">{icon}</div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>

      {/* 통계 정보 (4개 카드) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          📊 {category} 현황
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatisticsCard
            icon="💰"
            title="총 보상 풀"
            value={`${statistics.totalRewardPool.toLocaleString()} PMC`}
            subtitle="MoneyWave 할당"
            color="text-purple-600"
          />
          <StatisticsCard
            icon="👥"
            title="총 참여자"
            value={statistics.totalParticipants}
            subtitle="누적 참여"
            color="text-blue-600"
          />
          <StatisticsCard
            icon="🎮"
            title="활성 게임"
            value={statistics.activeGames}
            subtitle="진행 중"
            color="text-green-600"
          />
          <StatisticsCard
            icon="📂"
            title="서브카테고리"
            value={statistics.subcategoryCount}
            subtitle="이용 가능"
            color="text-orange-600"
          />
        </div>
      </section>

      {/* 인기 서브카테고리 TOP 3 */}
      {showPopularSection && popularSubcategories.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            🔥 인기 서브카테고리 TOP 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularSubcategories.slice(0, 3).map((subcategory) => (
              <PopularSubcategoryCard
                key={subcategory.id}
                subcategory={subcategory}
              />
            ))}
          </div>
        </section>
      )}

      {/* 실제 게임/콘텐츠 리스트 */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            🎯 최신 {category} 게임
          </h2>
          {games.length > maxGamesDisplay && (
            <Link
              href={`/${category.toLowerCase()}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {displayGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayGames.map((game) => (
              <EnhancedGameCard
                key={game.id}
                {...game}
                totalPrize={
                  (game as any).totalPrize ?? (game as any).totalStake ?? 0
                }
                LinkComponent={Link}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 게임이 없습니다
            </h3>
            <p className="text-gray-600">
              새로운 {category} 게임이 곧 추가될 예정입니다!
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

// 기존 GameCard 컴포넌트 (호환성 유지)
export function GameCard({ game }: { game: any }) {
  // 기본 LinkComponent (단순 앵커 태그)
  const DefaultLink: ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ href, children, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );

  // 기존 데이터를 EnhancedGameCard 형식으로 변환
  const enhancedGame: EnhancedGameCardProps = {
    id: game.id || `game-${Math.random()}`,
    title: game.title,
    description: game.description,
    category: game.category,
    gameType: (game.gameType as GameType) || "binary",
    status: game.status || "active",
    difficulty: game.difficulty || "medium",
    participants: game.participants || 0,
    totalPrize: game.totalPrize ?? game.totalStake ?? 0,
    minStake: game.minStake || 0,
    maxStake: game.maxStake || 1000,
    expectedReturn: game.expectedReturn || 1.5,
    endTime:
      game.endTime ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    href: game.href || `/prediction/game/${game.id}`,
    LinkComponent: DefaultLink,
    moneyWave: {
      allocatedPool: (game.totalStake || 1000) * 2,
      currentPool: game.totalStake || 500,
      waveMultiplier: 1.5,
    },
    imagePlaceholder: `${game.category} 예측`,
    tags: game.tags || [],
    isHot: game.isHot || false,
    isFeatured: game.isFeatured || false,
  };

  return (
    <EnhancedGameCard
      {...enhancedGame}
      totalPrize={
        (enhancedGame as any).totalPrize ??
        (enhancedGame as any).totalStake ??
        0
      }
      LinkComponent={DefaultLink}
    />
  );
}
