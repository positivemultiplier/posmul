"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { mcp_supabase_execute_sql } from "@/shared/mcp/supabase-client";
import React, { useEffect, useState } from "react";

interface RealTimePredictionDashboardProps {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PredictionGame {
  gameId: string;
  title: string;
  predictionType: string;
  status: string;
  endTime: string;
  totalParticipants: number;
  totalStake: number;
  userParticipation?: {
    predictionId: string;
    betAmount: number;
    confidence: number;
    expectedReward: number;
  } | null;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  successRate: number;
  totalWinnings: number;
  participationCount: number;
  agencyScore: number;
  rank: number;
}

interface PredictionStats {
  totalGames: number;
  activeGames: number;
  userParticipations: number;
  userSuccessRate: number;
  totalStaked: number;
  totalWinnings: number;
  averageConfidence: number;
  bestPrediction: {
    gameTitle: string;
    winAmount: number;
    confidence: number;
  } | null;
}

const PROJECT_ID = "fabyagohqqnusmnwekuc";

export const RealTimePredictionDashboard: React.FC<
  RealTimePredictionDashboardProps
> = ({ userId, autoRefresh = true, refreshInterval = 30000 }) => {
  const [activeGames, setActiveGames] = useState<PredictionGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchActiveGames = async () => {
    try {
      const gamesQuery = `
        SELECT 
          pg.game_id,
          pg.title,
          pg.prediction_type,
          pg.status,
          pg.end_time,
          COUNT(p.prediction_id) as total_participants,
          COALESCE(SUM(p.bet_amount), 0) as total_stake
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id AND p.is_active = true
        WHERE pg.status IN ('ACTIVE', 'PENDING')
        GROUP BY pg.game_id, pg.title, pg.prediction_type, pg.status, pg.end_time
        ORDER BY pg.created_at DESC
        LIMIT 10
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: gamesQuery,
      });

      if (result?.data) {
        const games: PredictionGame[] = await Promise.all(
          result.data.map(async (game: any) => {
            let userParticipation = null;

            if (userId) {
              const userQuery = `
                SELECT 
                  prediction_id,
                  bet_amount,
                  confidence_level,
                  expected_reward
                FROM predictions 
                WHERE game_id = '${game.game_id}' AND user_id = '${userId}' AND is_active = true
                LIMIT 1
              `;

              const userResult = await mcp_supabase_execute_sql({
                project_id: PROJECT_ID,
                query: userQuery,
              });

              if (userResult?.data?.[0]) {
                const userData = userResult.data[0];
                userParticipation = {
                  predictionId: userData.prediction_id,
                  betAmount: userData.bet_amount,
                  confidence: userData.confidence_level,
                  expectedReward: userData.expected_reward || 0,
                };
              }
            }

            return {
              gameId: game.game_id,
              title: game.title,
              predictionType: game.prediction_type,
              status: game.status,
              endTime: game.end_time,
              totalParticipants: game.total_participants || 0,
              totalStake: game.total_stake || 0,
              userParticipation,
            };
          })
        );

        setActiveGames(games);
      }
    } catch (err) {
      console.error("Failed to fetch active games:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const leaderboardQuery = `
        SELECT 
          p.user_id,
          CONCAT('User-', SUBSTRING(p.user_id, 1, 8)) as display_name,
          COUNT(*) as participation_count,
          AVG(p.confidence_level) as avg_confidence,
          SUM(p.bet_amount) as total_staked,
          COUNT(*) FILTER (WHERE p.is_winner = true) as wins,
          SUM(p.expected_reward) FILTER (WHERE p.is_winner = true) as total_winnings,
          ROW_NUMBER() OVER (ORDER BY (COUNT(*) FILTER (WHERE p.is_winner = true)::float / COUNT(*)) DESC, COUNT(*) DESC) as rank
        FROM predictions p
        WHERE p.is_active = true
        GROUP BY p.user_id
        HAVING COUNT(*) >= 3
        ORDER BY (COUNT(*) FILTER (WHERE p.is_winner = true)::float / COUNT(*)) DESC, COUNT(*) DESC
        LIMIT 10
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: leaderboardQuery,
      });

      if (result?.data) {
        const leaderboardData: LeaderboardEntry[] = result.data.map(
          (entry: any) => ({
            userId: entry.user_id,
            displayName: entry.display_name,
            successRate:
              entry.participation_count > 0
                ? entry.wins / entry.participation_count
                : 0,
            totalWinnings: entry.total_winnings || 0,
            participationCount: entry.participation_count || 0,
            agencyScore: Math.min(
              0.95,
              (entry.wins / entry.participation_count) * 0.8 +
                (entry.avg_confidence / 100) * 0.2
            ),
            rank: entry.rank,
          })
        );

        setLeaderboard(leaderboardData);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_participations,
          COUNT(*) FILTER (WHERE is_winner = true) as wins,
          SUM(bet_amount) as total_staked,
          SUM(expected_reward) FILTER (WHERE is_winner = true) as total_winnings,
          AVG(confidence_level) as avg_confidence,
          MAX(expected_reward) as best_win
        FROM predictions 
        WHERE user_id = '${userId}' AND is_active = true
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: statsQuery,
      });

      if (result?.data?.[0]) {
        const data = result.data[0];
        setStats({
          totalGames: activeGames.length,
          activeGames: activeGames.filter((g) => g.status === "ACTIVE").length,
          userParticipations: data.total_participations || 0,
          userSuccessRate:
            data.total_participations > 0
              ? data.wins / data.total_participations
              : 0,
          totalStaked: data.total_staked || 0,
          totalWinnings: data.total_winnings || 0,
          averageConfidence: data.avg_confidence || 0,
          bestPrediction: data.best_win
            ? {
                gameTitle: "최고 성과 게임",
                winAmount: data.best_win,
                confidence: data.avg_confidence || 0,
              }
            : null,
        });
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchActiveGames(),
        fetchLeaderboard(),
        fetchUserStats(),
      ]);
      setLastRefresh(new Date());
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`;
  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "종료됨";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간`;
    }

    return `${hours}시간 ${minutes}분`;
  };

  const getPredictionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "binary":
        return "🔵";
      case "wdl":
        return "🟡";
      case "ranking":
        return "🏆";
      default:
        return "🎯";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            진행중
          </Badge>
        );
      case "PENDING":
        return <Badge variant="secondary">대기중</Badge>;
      case "ENDED":
        return <Badge variant="outline">종료</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 예측 게임 대시보드</CardTitle>
            <CardDescription>데이터를 불러오는 중...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                📊 내 예측 성과
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </span>
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  {lastRefresh.toLocaleTimeString()} 업데이트
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.userParticipations}
                </div>
                <div className="text-sm text-gray-600">참여 게임</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(stats.userSuccessRate)}
                </div>
                <div className="text-sm text-gray-600">성공률</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(stats.totalStaked)}
                </div>
                <div className="text-sm text-gray-600">총 베팅 PMP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(stats.totalWinnings)}
                </div>
                <div className="text-sm text-gray-600">총 획득 PMC</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 활성 게임 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 활성 예측 게임</CardTitle>
          <CardDescription>
            현재 참여 가능한 예측 게임 ({activeGames.length}개)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGames.map((game) => (
              <div
                key={game.gameId}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  game.userParticipation
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {getPredictionTypeIcon(game.predictionType)}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        {game.title}
                      </h4>
                      {getStatusBadge(game.status)}
                      {game.userParticipation && (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800"
                        >
                          참여중
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">참여자:</span>
                        <span className="font-medium ml-1">
                          {game.totalParticipants}명
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">총 베팅:</span>
                        <span className="font-medium ml-1">
                          {formatNumber(game.totalStake)} PMP
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">남은 시간:</span>
                        <span className="font-medium ml-1">
                          {formatTimeRemaining(game.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">타입:</span>
                        <span className="font-medium ml-1">
                          {game.predictionType.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {game.userParticipation && (
                      <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>내 참여 현황:</strong>{" "}
                          {formatNumber(game.userParticipation.betAmount)} PMP
                          베팅 • 신뢰도 {game.userParticipation.confidence}% •
                          예상 획득{" "}
                          {formatNumber(game.userParticipation.expectedReward)}{" "}
                          PMC
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {activeGames.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                현재 활성 상태인 예측 게임이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 리더보드 */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 예측 게임 리더보드</CardTitle>
          <CardDescription>Agency Theory 기반 종합 성과 순위</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.userId === userId
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-gray-400 text-white"
                        : index === 2
                        ? "bg-orange-400 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-medium">{entry.displayName}</div>
                    <div className="text-xs text-gray-600">
                      성공률 {formatPercentage(entry.successRate)} •
                      {entry.participationCount}게임 참여
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatNumber(entry.totalWinnings)} PMC
                  </div>
                  <div className="text-xs text-gray-600">
                    Agency Score: {formatPercentage(entry.agencyScore)}
                  </div>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                충분한 참여 데이터가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 자동 새로고침 상태 */}
      {autoRefresh && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{refreshInterval / 1000}초마다 자동 업데이트</span>
          </div>
        </div>
      )}
    </div>
  );
};
