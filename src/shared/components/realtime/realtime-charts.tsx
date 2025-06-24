"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
} from "@/shared/components/ui/charts";
import {
  useRealtimeEconomicData,
  useRealtimeMarketData,
  useRealtimeMoneyWave,
  useRealtimePredictionGames,
} from "@/shared/stores/realtime-data-store";
import { useEffect, useMemo, useState } from "react";

// 실시간 경제 트렌드 차트
export function RealtimeEconomicTrendChart() {
  const economicData = useRealtimeEconomicData();
  const [historicalData, setHistoricalData] = useState<
    Array<{
      time: string;
      pmpBalance: number;
      pmcBalance: number;
      totalValue: number;
    }>
  >([]);

  useEffect(() => {
    if (economicData) {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        pmpBalance: economicData.pmpBalance,
        pmcBalance: economicData.pmcBalance,
        totalValue: economicData.totalValue,
      };

      setHistoricalData((prev) => {
        const updated = [...prev, newDataPoint];
        // 최근 20개 데이터 포인트만 유지
        return updated.slice(-20);
      });
    }
  }, [economicData]);

  if (historicalData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 실시간 경제 트렌드
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            데이터를 수집하는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 실시간 경제 트렌드
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <Badge variant="outline" className="ml-auto">
            {historicalData.length}개 데이터 포인트
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart
          data={historicalData}
          xAxisKey="time"
          dataKey="totalValue"
          height={300}
          title="총 자산 가치 변화"
          showGrid={true}
          animate={true}
          gradientFill={true}
          color="#3B82F6"
        />
      </CardContent>
    </Card>
  );
}

// 실시간 MoneyWave 진행률 차트
export function RealtimeMoneyWaveChart() {
  const moneyWave = useRealtimeMoneyWave();
  const [waveHistory, setWaveHistory] = useState<
    Array<{
      time: string;
      currentHourPool: number;
      distributedThisHour: number;
      participantsThisHour: number;
    }>
  >([]);

  useEffect(() => {
    if (moneyWave) {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        currentHourPool: moneyWave.currentHourPool,
        distributedThisHour: moneyWave.distributedThisHour,
        participantsThisHour: moneyWave.participantsThisHour,
      };

      setWaveHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-15); // 최근 15개 포인트
      });
    }
  }, [moneyWave]);

  const urgencyColor = useMemo(() => {
    if (!moneyWave) return "#3B82F6";
    switch (moneyWave.urgencyLevel) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  }, [moneyWave?.urgencyLevel]);

  const timeRemaining = moneyWave
    ? Math.floor(moneyWave.timeRemaining / 60)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌊 실시간 MoneyWave 진행률
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          {moneyWave && (
            <Badge
              variant={
                moneyWave.urgencyLevel === "high" ? "destructive" : "default"
              }
              className="ml-auto"
            >
              {timeRemaining}분 남음
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {moneyWave ? (
          <div className="space-y-4">
            {/* 진행률 바 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>분배 진행률</span>
                <span>
                  ₩{moneyWave.distributedThisHour.toLocaleString()} / ₩
                  {moneyWave.currentHourPool.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (moneyWave.distributedThisHour /
                        moneyWave.currentHourPool) *
                        100,
                      100
                    )}%`,
                    backgroundColor: urgencyColor,
                  }}
                ></div>
              </div>
            </div>

            {/* 실시간 차트 */}
            {waveHistory.length > 0 && (
              <AreaChart
                data={waveHistory}
                xAxisKey="time"
                dataKey="currentHourPool"
                height={200}
                color={urgencyColor}
                showGrid={false}
                animate={true}
              />
            )}

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {moneyWave.participantsThisHour}
                </div>
                <div className="text-xs text-gray-600">참여자</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ₩{(moneyWave.distributedThisHour / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600">분배됨</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ₩{(moneyWave.nextHourPreview / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600">다음 시간</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            MoneyWave 데이터를 불러오는 중...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 실시간 예측 게임 현황 차트
export function RealtimePredictionGamesChart() {
  const games = useRealtimePredictionGames();

  const chartData = useMemo(() => {
    if (!games || games.length === 0) return [];

    const statusCounts = games.reduce((acc, game) => {
      acc[game.status] = (acc[game.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name:
        status === "ACTIVE"
          ? "진행중"
          : status === "ENDED"
          ? "종료"
          : "정산완료",
      value: count,
      color:
        status === "ACTIVE"
          ? "#10B981"
          : status === "ENDED"
          ? "#F59E0B"
          : "#6B7280",
    }));
  }, [games]);

  const totalStaked = useMemo(() => {
    return games?.reduce((sum, game) => sum + game.totalStaked, 0) || 0;
  }, [games]);

  const totalParticipants = useMemo(() => {
    return games?.reduce((sum, game) => sum + game.participantCount, 0) || 0;
  }, [games]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 실시간 예측 게임 현황
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <Badge variant="outline" className="ml-auto">
            {games?.length || 0}개 게임
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            <PieChart
              data={chartData}
              height={250}
              showLegend={true}
              animate={true}
            />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalStaked.toLocaleString()} PMP
                </div>
                <div className="text-xs text-gray-600">총 베팅액</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {totalParticipants}명
                </div>
                <div className="text-xs text-gray-600">총 참여자</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            활성 게임이 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 실시간 시장 데이터 차트
export function RealtimeMarketDataChart() {
  const marketData = useRealtimeMarketData() as any[];

  const chartData = useMemo(() => {
    return marketData.map((data) => ({
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      color:
        data.trend === "UP"
          ? "#10B981"
          : data.trend === "DOWN"
          ? "#EF4444"
          : "#6B7280",
    }));
  }, [marketData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 실시간 시장 데이터
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <Badge variant="outline" className="ml-auto">
            {marketData.length}개 종목
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            xAxisKey="symbol"
            dataKey="changePercent"
            height={250}
            title="종목별 변동률 (%)"
            showGrid={true}
            animate={true}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            시장 데이터를 불러오는 중...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 실시간 대시보드 (모든 차트 통합)
export function RealtimeDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeEconomicTrendChart />
        <RealtimeMoneyWaveChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimePredictionGamesChart />
        <RealtimeMarketDataChart />
      </div>
    </div>
  );
}
