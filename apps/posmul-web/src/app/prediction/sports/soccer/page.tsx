/**
 * Soccer Predictions Card List Page
 *
 * Displays prediction games related to soccer matches
 * Based on the 3-tier navigation: prediction/sports/soccer
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { Badge } from "@posmul/shared-ui";
import { Button } from "@posmul/shared-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@posmul/shared-ui";
import Link from "next/link";
import { Suspense } from "react";

// Slug mapping for detail pages
const slugMapping: Record<string, string> = {
  "soccer-001": "world-cup-winner",
  "soccer-002": "manchester-vs-liverpool",
  "soccer-003": "premier-league-top4",
  "soccer-004": "world-cup-winner",
  "soccer-005": "manchester-vs-liverpool",
  "soccer-006": "premier-league-top4",
};

// Mock data for soccer prediction games
const soccerPredictions = [
  {
    id: "soccer-001",
    title: "2024 FIFA 월드컵 우승팀 예측",
    description: "2024년 FIFA 월드컵에서 우승할 팀을 예측해보세요",
    category: "국제대회",
    participants: 1247,
    totalStake: 45600,
    endTime: "2024-12-31T23:59:59Z",
    status: "active",
    options: ["브라질", "아르헨티나", "프랑스", "독일", "기타"],
    minStake: 1000,
    maxStake: 50000,
    difficulty: "high",
    expectedReturn: 2.4,
  },
  {
    id: "soccer-002",
    title: "EPL 2024-25 시즌 득점왕 예측",
    description: "프리미어리그 2024-25 시즌 최다 득점자를 맞춰보세요",
    category: "유럽리그",
    participants: 892,
    totalStake: 28400,
    endTime: "2025-05-25T23:59:59Z",
    status: "active",
    options: ["홀란드", "살라", "케인", "음바페", "기타"],
    minStake: 500,
    maxStake: 30000,
    difficulty: "medium",
    expectedReturn: 1.8,
  },
  {
    id: "soccer-003",
    title: "K리그1 2024 챔피언 예측",
    description: "K리그1 2024시즌 우승팀을 예측해보세요",
    category: "국내리그",
    participants: 567,
    totalStake: 15200,
    endTime: "2024-12-01T23:59:59Z",
    status: "active",
    options: ["울산 현대", "포항 스틸러스", "전북 현대", "기타"],
    minStake: 1000,
    maxStake: 20000,
    difficulty: "medium",
    expectedReturn: 1.6,
  },
  {
    id: "soccer-004",
    title: "챔피언스리그 2024-25 우승팀",
    description: "UEFA 챔피언스리그 우승팀을 예측해보세요",
    category: "유럽리그",
    participants: 2156,
    totalStake: 87300,
    endTime: "2025-06-01T23:59:59Z",
    status: "active",
    options: ["맨체스터 시티", "레알 마드리드", "PSG", "바르셀로나", "기타"],
    minStake: 2000,
    maxStake: 100000,
    difficulty: "high",
    expectedReturn: 3.2,
  },
  {
    id: "soccer-005",
    title: "아시안컵 2024 한국 성적 예측",
    description: "AFC 아시안컵에서 한국의 최종 성적을 예측해보세요",
    category: "국제대회",
    participants: 1834,
    totalStake: 62100,
    endTime: "2024-02-10T23:59:59Z",
    status: "ended",
    options: ["우승", "준우승", "4강", "8강", "조별리그"],
    minStake: 1000,
    maxStake: 40000,
    difficulty: "medium",
    expectedReturn: 2.1,
  },
  {
    id: "soccer-006",
    title: "손흥민 2024-25 시즌 골 수",
    description: "손흥민이 2024-25 시즌에 넣을 총 골 수를 예측해보세요",
    category: "선수기록",
    participants: 945,
    totalStake: 31800,
    endTime: "2025-05-25T23:59:59Z",
    status: "active",
    options: ["15골 이하", "16-20골", "21-25골", "26골 이상"],
    minStake: 500,
    maxStake: 25000,
    difficulty: "medium",
    expectedReturn: 1.9,
  },
];

function PredictionCard({
  prediction,
}: {
  prediction: (typeof soccerPredictions)[0];
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const detailSlug = slugMapping[prediction.id] || prediction.id;

  return (
    <Link href={`/prediction/sports/soccer/${detailSlug}`} className="block">
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:border-blue-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {prediction.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {prediction.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className={getStatusColor(prediction.status)}>
                {prediction.status === "active"
                  ? "진행중"
                  : prediction.status === "ended"
                  ? "종료"
                  : "대기중"}
              </Badge>
              <Badge className={getDifficultyColor(prediction.difficulty)}>
                {prediction.difficulty === "high"
                  ? "고난이도"
                  : prediction.difficulty === "medium"
                  ? "중난이도"
                  : "저난이도"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Prediction Options */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              예측 옵션
            </h4>
            <div className="flex flex-wrap gap-2">
              {prediction.options.slice(0, 3).map((option, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md"
                >
                  {option}
                </span>
              ))}
              {prediction.options.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-md">
                  +{prediction.options.length - 3}개 더
                </span>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">참여자</span>
              <div className="font-semibold text-gray-900">
                {prediction.participants.toLocaleString()}명
              </div>
            </div>
            <div>
              <span className="text-gray-500">총 스테이크</span>
              <div className="font-semibold text-gray-900">
                {prediction.totalStake.toLocaleString()} PMP
              </div>
            </div>
            <div>
              <span className="text-gray-500">예상 수익률</span>
              <div className="font-semibold text-green-600">
                {prediction.expectedReturn}x
              </div>
            </div>
            <div>
              <span className="text-gray-500">마감일</span>
              <div className="font-semibold text-gray-900">
                {formatDate(prediction.endTime)}
              </div>
            </div>
          </div>

          {/* Stake Range */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">참여 금액 범위</div>
            <div className="text-sm font-medium text-gray-900">
              {prediction.minStake.toLocaleString()} -{" "}
              {prediction.maxStake.toLocaleString()} PMP
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full group-hover:bg-blue-600 transition-colors"
            disabled={prediction.status === "ended"}
          >
            {prediction.status === "active" ? "예측 참여하기" : "종료된 게임"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

function PredictionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SoccerPredictionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-3xl">⚽</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">축구 예측</h1>
            <p className="text-gray-600">
              국내외 축구 경기 결과를 예측하고 PMP를 획득하세요
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">활성 게임</div>
            <div className="text-2xl font-bold text-blue-900">
              {soccerPredictions.filter((p) => p.status === "active").length}개
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">총 참여자</div>
            <div className="text-2xl font-bold text-green-900">
              {soccerPredictions
                .reduce((sum, p) => sum + p.participants, 0)
                .toLocaleString()}
              명
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">
              총 스테이크
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {soccerPredictions
                .reduce((sum, p) => sum + p.totalStake, 0)
                .toLocaleString()}{" "}
              PMP
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">
              평균 수익률
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {(
                soccerPredictions.reduce(
                  (sum, p) => sum + p.expectedReturn,
                  0
                ) / soccerPredictions.length
              ).toFixed(1)}
              x
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            전체
          </Button>
          <Button variant="outline" size="sm">
            국제대회
          </Button>
          <Button variant="outline" size="sm">
            유럽리그
          </Button>
          <Button variant="outline" size="sm">
            국내리그
          </Button>
          <Button variant="outline" size="sm">
            선수기록
          </Button>
        </div>
      </div>

      {/* Predictions Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PredictionCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {soccerPredictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </Suspense>
    </div>
  );
}
