/**
 * UnifiedGameCard - 통합 게임 카드 컴포넌트
 * 
 * CategoryOverviewLayout에서 사용하는 간소화된 게임 카드
 */
"use client";

import React from "react";
import { Card, Badge } from "../base";

// CategoryOverviewLayout에서 사용하는 GameCardProps
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

interface UnifiedGameCardProps {
  game: GameCardProps;
  userId?: string;
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
  }>;
  className?: string;
}

const getGameTypeIcon = (gameType?: string) => {
  switch (gameType?.toLowerCase()) {
    case 'binary':
      return '';
    case 'wdl':
    case 'win_draw_lose':
      return '';
    case 'ranking':
      return '';
    default:
      return '';
  }
};

const getStatusBadge = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return <Badge variant="default">참여 가능</Badge>;
    case 'pending':
      return <Badge variant="secondary">시작 예정</Badge>;
    case 'ended':
      return <Badge variant="outline">종료</Badge>;
    default:
      return <Badge variant="default">참여 가능</Badge>;
  }
};

export const UnifiedGameCard: React.FC<UnifiedGameCardProps> = ({
  game,
  userId,
  LinkComponent = ({ href, children }) => <a href={href}>{children}</a>,
  className,
}) => {
  void userId;
  const cardContent = (
    <Card className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${className || ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getGameTypeIcon(game.gameType)}</span>
          {game.isHot && <span className="text-red-500"></span>}
          {game.isFeatured && <span className="text-yellow-500"></span>}
        </div>
        {getStatusBadge(game.status)}
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {game.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {game.description}
      </p>

      {/* Options Preview */}
      <div className="space-y-2 mb-4">
        {game.options.slice(0, 2).map((option) => (
          <div key={option.id} className="flex justify-between items-center">
            <span className="text-sm text-gray-700">
              {option.label || option.title || '옵션'}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {option.probability ? `${(option.probability * 100).toFixed(1)}%` : 
               option.percentage ? `${option.percentage}%` : 
               option.odds ? `${option.odds}x` : 'N/A'}
            </span>
          </div>
        ))}
        {game.options.length > 2 && (
          <div className="text-center text-xs text-gray-500">
            +{game.options.length - 2}개 더...
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-500">참여자</span>
          <div className="font-medium">{game.participants}명</div>
        </div>
        <div>
          <span className="text-gray-500">총 스테이크</span>
          <div className="font-medium text-green-600">
            {game.totalStake || game.totalStaked || 0} PMP
          </div>
        </div>
      </div>

      {/* MoneyWave Info */}
      {game.moneyWave && (
        <div className="bg-blue-50 p-3 rounded-lg mb-3">
          <div className="text-xs text-blue-600 font-medium">
            상금 풀: {game.moneyWave.allocatedPool?.toLocaleString()} PMC
          </div>
          <div className="text-xs text-gray-600">
            배수: {game.moneyWave.waveMultiplier}x
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <div>종료: {new Date(game.endTime).toLocaleDateString()}</div>
        {game.tags && (
          <div className="flex gap-1">
            {game.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-gray-100 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  // 링크로 감싸기
  if (game.href && LinkComponent) {
    return (
      <LinkComponent href={game.href}>
        {cardContent}
      </LinkComponent>
    );
  }

  return cardContent;
};
