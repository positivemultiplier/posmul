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

import Link from "next/link";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

// 게임 유형 정의
export type GameType = "binary" | "wdl" | "ranking" | "multichoice";

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
  description: string;
  category: string;
  gameType: GameType;

  // 이미지 정보
  imageUrl?: string;
  imageAlt?: string;
  imagePlaceholder?: string; // 개발 중 placeholder 텍스트

  // 게임 상태
  status: "active" | "ended" | "pending" | "settling";
  difficulty: "high" | "medium" | "low";

  // 참여 정보
  participants: number;
  maxParticipants?: number;
  totalStake: number;
  minStake: number;
  maxStake: number;

  // MoneyWave 정보
  moneyWave: MoneyWaveInfo;

  // 게임 옵션
  options?: GameOption[];

  // 시간 정보
  startTime?: string;
  endTime: string;
  settlementTime?: string;

  // 수익 정보
  expectedReturn: number;
  currentOdds?: number;

  // 미니 차트 (추후 구현)
  chartData?: MiniChartData;

  // 링크
  href: string;

  // 추가 정보
  tags?: string[];
  isHot?: boolean;
  isFeatured?: boolean;
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

export function EnhancedGameCard({ game }: { game: EnhancedGameCardProps }) {
  const typeInfo = gameTypeInfo[game.gameType];
  const timeLeft = new Date(game.endTime).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link href={game.href} className="block">
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:border-blue-300 overflow-hidden group">
        {/* 헤더 영역 */}
        <CardHeader className="pb-3 relative">
          {/* 상단 배지들 */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2">
              <Badge className={typeInfo.color}>
                {typeInfo.icon} {typeInfo.label}
              </Badge>
              <Badge className={statusColors[game.status]}>
                {game.status === "active"
                  ? "진행중"
                  : game.status === "ended"
                    ? "종료"
                    : game.status === "settling"
                      ? "정산중"
                      : "대기중"}
              </Badge>
            </div>
            <div className="flex gap-2">
              {game.isHot && (
                <Badge className="bg-red-100 text-red-800">🔥 HOT</Badge>
              )}
              {game.isFeatured && (
                <Badge className="bg-yellow-100 text-yellow-800">⭐ 추천</Badge>
              )}
            </div>
          </div>

          {/* 이미지 영역 */}
          <div className="mb-3">
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.imageAlt || game.title}
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <ImagePlaceholder
                text={game.imagePlaceholder}
                gameType={game.gameType}
              />
            )}
          </div>

          {/* 제목과 설명 */}
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {game.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {game.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* MoneyWave 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                💰 MoneyWave
              </span>
              <span className="text-sm font-bold text-purple-600">
                {game.moneyWave.waveMultiplier}x 배수
              </span>
            </div>
            <MoneyWaveProgress moneyWave={game.moneyWave} />
          </div>

          {/* 참여 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {game.participants.toLocaleString()}
                {game.maxParticipants && (
                  <span className="text-sm text-gray-500">
                    /{game.maxParticipants.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">참여자</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {game.expectedReturn}x
              </div>
              <div className="text-xs text-gray-500">예상 수익</div>
            </div>
          </div>

          {/* 게임 옵션 미리보기 */}
          <OptionsPreview options={game.options} gameType={game.gameType} />

          {/* 미니 차트 */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">
              📊 참여 트렌드
            </div>
            <MiniChart data={game.chartData} />
          </div>

          {/* 하단 정보 */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">{game.category}</div>
            <div className="text-xs text-gray-500">
              {daysLeft > 0 ? `${daysLeft}일 남음` : formatDate(game.endTime)}
            </div>
          </div>

          {/* 태그 */}
          {game.tags && game.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {game.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
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

  return <EnhancedGameCard game={enhancedGame} />;
}
