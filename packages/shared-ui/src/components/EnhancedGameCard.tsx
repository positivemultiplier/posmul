/**
 * Enhanced Game Card Component
 *
 * 개선된 게임 카드 컴포넌트 - 더 풍부한 정보와 시각적 요소 포함
 * - 이미지 placeholder (개발 중)
 * - 게임 유형 (binary/wdl/ranking/multichoice)
 * - MoneyWave 정보
 * - 미니 그래프 (추후 구현)
 * - 진행률 표시
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import type { ComponentType } from "react";
import { Badge } from "./ui/badge.js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.js";

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
};

// 게임 유형 정의
export type GameType =
  | "SPORTS"
  | "INVESTMENT"
  | "POLITICS"
  | "ENTERTAINMENT"
  | "USER_PROPOSED";

// 옵션 정보 (예측 선택지)
export interface GameOption {
  id: string;
  label: string;
  probability?: number;
  odds?: number;
  volume?: number;
}

// MoneyWave 정보
export interface MoneyWaveInfo {
  allocatedPool: number; // 할당된 풀 (PMC)
  currentPool: number; // 현재 누적 풀
  waveMultiplier: number; // 파도 배수
  distributionDate?: string; // 분배 예정일
}

// 미니 차트 데이터 (추후 구현)
export interface MiniChartData {
  type: "line" | "bar" | "pie";
  data: number[];
  labels?: string[];
  trend?: "up" | "down" | "stable";
}

// 개선된 게임 카드 Props
export interface EnhancedGameCardProps {
  id: string;
  title: string;
  status: string;
  participants: number;
  totalPrize: number;
  gameType: string;
  href: string;
  LinkComponent: ComponentType<LinkProps>;
  // other game properties can be added here
}

// 게임 유형별 아이콘과 설명
const gameTypeInfo = {
  binary: {
    icon: "⚡",
    label: "예/아니오",
    color: "bg-blue-100 text-blue-800",
  },
  wdl: { icon: "🎯", label: "승/무/패", color: "bg-green-100 text-green-800" },
  ranking: {
    icon: "🏆",
    label: "순위 예측",
    color: "bg-purple-100 text-purple-800",
  },
  multichoice: {
    icon: "🎲",
    label: "다중 선택",
    color: "bg-orange-100 text-orange-800",
  },
};

// 상태별 색상
const statusColors = {
  active: "bg-green-100 text-green-800",
  ended: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  settling: "bg-blue-100 text-blue-800",
};

// 난이도별 색상
const difficultyColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

// 이미지 Placeholder 컴포넌트
function ImagePlaceholder({
  text,
  gameType,
}: {
  text?: string;
  gameType: GameType;
}) {
  const typeInfo = gameTypeInfo[gameType];

  return (
    <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2">{typeInfo.icon}</div>
        <div className="text-sm text-gray-500">{text || "이미지 준비 중"}</div>
      </div>
    </div>
  );
}

// MoneyWave 진행률 표시
function MoneyWaveProgress({ moneyWave }: { moneyWave: MoneyWaveInfo }) {
  const progress = Math.min(
    (moneyWave.currentPool / moneyWave.allocatedPool) * 100,
    100
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">MoneyWave 진행률</span>
        <span className="font-medium">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{moneyWave.currentPool.toLocaleString()} PMC</span>
        <span>{moneyWave.allocatedPool.toLocaleString()} PMC</span>
      </div>
    </div>
  );
}

// 미니 차트 Placeholder (추후 실제 차트로 교체)
function MiniChart({ data }: { data?: MiniChartData }) {
  if (!data) {
    return (
      <div className="w-full h-16 bg-gray-50 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">차트 준비 중</span>
      </div>
    );
  }

  // 간단한 선형 차트 시뮬레이션
  return (
    <div className="w-full h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded flex items-end justify-between px-2 py-1">
      {data.data.slice(0, 8).map((value, index) => (
        <div
          key={index}
          className="bg-blue-400 rounded-sm w-2 transition-all duration-300"
          style={{ height: `${(value / Math.max(...data.data)) * 100}%` }}
        />
      ))}
    </div>
  );
}

// 게임 옵션 미리보기
function OptionsPreview({
  options,
  gameType,
}: {
  options?: GameOption[];
  gameType: GameType;
}) {
  if (!options || options.length === 0) return null;

  const displayOptions = options.slice(0, 3);

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-700">주요 옵션</div>
      <div className="space-y-1">
        {displayOptions.map((option, index) => (
          <div key={option.id} className="flex justify-between text-xs">
            <span className="text-gray-600 truncate flex-1">
              {option.label}
            </span>
            <span className="font-medium text-gray-900 ml-2">
              {option.odds
                ? `${option.odds}배`
                : `${(option.probability || 0) * 100}%`}
            </span>
          </div>
        ))}
        {options.length > 3 && (
          <div className="text-xs text-gray-400">
            +{options.length - 3}개 더
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedGameCard({
  id,
  title,
  status,
  participants,
  totalPrize,
  gameType,
  href,
  LinkComponent,
}: EnhancedGameCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            <LinkComponent href={href} className="hover:underline">
              {title}
            </LinkComponent>
          </CardTitle>
          <Badge variant="secondary">{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p>Participants: {participants}</p>
        <p>Prize Pool: ${totalPrize.toLocaleString()}</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-gray-500">Game Type: {gameType}</p>
      </CardFooter>
    </Card>
  );
}

// 기존 GameCard와의 호환성을 위한 어댑터
export function GameCardAdapter({ game }: { game: any }) {
  const enhancedGame: EnhancedGameCardProps = {
    ...game,
    gameType: "binary", // 기본값
    moneyWave: {
      allocatedPool: game.totalStake * 2,
      currentPool: game.totalStake,
      waveMultiplier: 1.5,
    },
    imagePlaceholder: `${game.category} 예측`,
  };

  return <EnhancedGameCard {...enhancedGame} />;
}
