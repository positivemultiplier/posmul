"use client";

import { useState, useEffect } from "react";

interface MoneyWaveData {
  wave1: {
    lastExecution: string | null;
    totalPmcIssued: number;
    affectedUsers: number;
  };
  wave2: {
    lastExecution: string | null;
    dormantPmcAmount: number;
    redistributedAmount: number;
  };
  wave3: {
    lastExecution: string | null;
    entrepreneurCount: number;
    investmentPool: number;
  };
  recentWaves: Array<{
    waveType: string;
    executionDate: string;
    pmcIssued: number;
    affectedUsers: number;
    status: string;
  }>;
  myRewards: {
    wave1: number;
    wave2: number;
    wave3: number;
    total: number;
  };
}

// Wave 타입 정보
const waveInfo = {
  wave1: {
    name: "Wave 1",
    title: "균등 분배",
    description: "전체 활성 사용자에게 균등 분배",
    icon: "🌊",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  wave2: {
    name: "Wave 2",
    title: "활동 보상",
    description: "활동 점수 비례 분배",
    icon: "🌀",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  wave3: {
    name: "Wave 3",
    title: "기여 보상",
    description: "핵심 기여자 보상",
    icon: "🔥",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "아직 없음";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

interface MoneyWaveDashboardProps {
  initialData?: MoneyWaveData;
}

export function MoneyWaveDashboard({ initialData }: MoneyWaveDashboardProps) {
  const [data, setData] = useState<MoneyWaveData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      fetchMoneyWaveData();
    }
  }, [initialData]);

  const fetchMoneyWaveData = async () => {
    try {
      const response = await fetch("/api/economy/moneywave");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || "데이터를 불러올 수 없습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <span className="text-4xl block mb-2">🌊</span>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">MoneyWave</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {error || "아직 MoneyWave 데이터가 없습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌊</span>
            <div>
              <h3 className="font-bold text-white text-lg">MoneyWave</h3>
              <p className="text-sm text-white/80">PMC 분배 시스템</p>
            </div>
          </div>
          {data.myRewards.total > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-xs text-white/80">내 총 수령액</div>
              <div className="text-lg font-bold text-white">
                +{data.myRewards.total.toLocaleString()} PMC
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wave Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Wave 1 */}
          <div className={`${waveInfo.wave1.bgColor} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{waveInfo.wave1.icon}</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {waveInfo.wave1.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {waveInfo.wave1.description}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">총 발행</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave1.totalPmcIssued.toLocaleString()} PMC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">수혜자</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave1.affectedUsers.toLocaleString()}명
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">최근 실행</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(data.wave1.lastExecution)}
                </span>
              </div>
              {data.myRewards.wave1 > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>내 수령액</span>
                    <span className="font-bold">+{data.myRewards.wave1.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wave 2 */}
          <div className={`${waveInfo.wave2.bgColor} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{waveInfo.wave2.icon}</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {waveInfo.wave2.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {waveInfo.wave2.description}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">휴면 PMC</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave2.dormantPmcAmount.toLocaleString()} PMC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">재분배</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave2.redistributedAmount.toLocaleString()} PMC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">최근 실행</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(data.wave2.lastExecution)}
                </span>
              </div>
              {data.myRewards.wave2 > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>내 수령액</span>
                    <span className="font-bold">+{data.myRewards.wave2.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wave 3 */}
          <div className={`${waveInfo.wave3.bgColor} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{waveInfo.wave3.icon}</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {waveInfo.wave3.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {waveInfo.wave3.description}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">기업가</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave3.entrepreneurCount}명
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">투자 풀</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.wave3.investmentPool.toLocaleString()} PMC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">최근 실행</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(data.wave3.lastExecution)}
                </span>
              </div>
              {data.myRewards.wave3 > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>내 수령액</span>
                    <span className="font-bold">+{data.myRewards.wave3.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Waves */}
        {data.recentWaves.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              최근 MoneyWave
            </h4>
            <div className="space-y-2">
              {data.recentWaves.slice(0, 5).map((wave, index) => {
                const waveType = wave.waveType as keyof typeof waveInfo;
                const info = waveInfo[waveType] || waveInfo.wave1;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{info.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {info.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(wave.executionDate)} · {wave.affectedUsers.toLocaleString()}명 수혜
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        +{wave.pmcIssued.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">PMC</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State for Recent Waves */}
        {data.recentWaves.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            아직 실행된 MoneyWave가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
