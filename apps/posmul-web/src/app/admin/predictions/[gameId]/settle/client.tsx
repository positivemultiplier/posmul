"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OptionStat {
  id: string;
  label: string;
  participantCount: number;
  totalStake: number;
  currentOdds: number;
}

interface Prediction {
  id: string;
  userId: string;
  selectedOptionId: string;
  stakeAmount: number;
  confidence: number;
}

interface SettlementClientProps {
  gameId: string;
  game: {
    title: string;
    description: string;
    status: string;
    endTime: string | null;
    settlementTime: string | null;
    category: string;
  };
  options: OptionStat[];
  totalPool: number;
  totalParticipants: number;
  predictions: Prediction[];
  adminUserId: string;
}

interface SettlementResultState {
  success: boolean;
  message: string;
  data?: {
    winnersCount: number;
    losersCount: number;
    totalPmcRewarded: number;
  };
}

interface SettleApiSuccessData {
  winnersCount?: number;
  losersCount?: number;
  totalPmcRewarded?: number;
}

type SettleApiResponse =
  | { success: true; data?: SettleApiSuccessData }
  | { success: false; error?: { message?: string } };

const REWARD_POOL_RATE = 0.9;

function getStatusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "bg-green-900/50 text-green-400";
  if (status === "SETTLED") return "bg-blue-900/50 text-blue-400";
  return "bg-gray-700";
}

async function postSettlement(
  gameId: string,
  payload: { correctOptionId: string; adminUserId: string }
): Promise<SettleApiResponse> {
  const response = await fetch(`/api/predictions/games/${gameId}/settle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as SettleApiResponse;
}

function GameHeader({
  title,
  description,
  category,
  status,
}: {
  title: string;
  description: string;
  category: string;
  status: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">⚙️</span>
        <h1 className="text-2xl font-bold">예측 게임 정산</h1>
      </div>

      <div className="space-y-2 text-gray-300">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && <p className="text-sm">{description}</p>}
        <div className="flex flex-wrap gap-4 text-sm mt-4">
          <span className="px-3 py-1 bg-gray-700 rounded-full">{category}</span>
          <span
            className={`px-3 py-1 rounded-full ${getStatusBadgeClass(status)}`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatsCards({
  totalPool,
  totalParticipants,
  optionCount,
}: {
  totalPool: number;
  totalParticipants: number;
  optionCount: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-yellow-400">
          {totalPool.toLocaleString()}
        </div>
        <div className="text-gray-400 mt-1">총 PMP 풀</div>
      </div>
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-blue-400">{totalParticipants}</div>
        <div className="text-gray-400 mt-1">총 참여자</div>
      </div>
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-green-400">{optionCount}</div>
        <div className="text-gray-400 mt-1">선택 옵션</div>
      </div>
    </div>
  );
}

function AlreadySettledNotice() {
  return (
    <div className="bg-blue-900/50 border border-blue-500 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <h3 className="font-bold text-blue-400">이미 정산 완료</h3>
          <p className="text-gray-300 text-sm">이 게임은 이미 정산이 완료되었습니다.</p>
        </div>
      </div>
    </div>
  );
}

function NoParticipantsNotice() {
  return (
    <div className="bg-yellow-900/50 border border-yellow-500 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-bold text-yellow-400">참여자 없음</h3>
          <p className="text-gray-300 text-sm">아직 참여자가 없어 정산할 수 없습니다.</p>
        </div>
      </div>
    </div>
  );
}

function OptionSelection({
  options,
  selectedOptionId,
  isSettling,
  onSelect,
}: {
  options: OptionStat[];
  selectedOptionId: string | null;
  isSettling: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">🎯 정답 옵션 선택</h3>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={isSettling}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedOptionId === option.id
                ? "border-green-500 bg-green-900/30"
                : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
            } ${isSettling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-semibold text-lg">
                  {selectedOptionId === option.id && "✓ "}
                  {option.label}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  참여자: {option.participantCount}명 | 총액: {option.totalStake.toLocaleString()} PMP
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">확률</div>
                <div className="font-bold text-yellow-400">
                  {(option.currentOdds * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettlementPreview({
  winnersCount,
  losersCount,
  estimatedReward,
}: {
  winnersCount: number;
  losersCount: number;
  estimatedReward: number;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">📊 정산 미리보기</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/30 rounded-lg p-4">
          <div className="text-green-400 text-sm">승리자</div>
          <div className="text-2xl font-bold">{winnersCount}명</div>
        </div>
        <div className="bg-red-900/30 rounded-lg p-4">
          <div className="text-red-400 text-sm">패배자</div>
          <div className="text-2xl font-bold">{losersCount}명</div>
        </div>
      </div>
      <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg">
        <div className="text-yellow-400 text-sm">예상 보상 PMC</div>
        <div className="text-2xl font-bold">{estimatedReward.toLocaleString()} PMC</div>
        <div className="text-xs text-gray-400 mt-1">
          * 실제 보상은 풀 비율에 따라 달라질 수 있습니다
        </div>
      </div>
    </div>
  );
}

function SettleButton({
  isSettling,
  disabled,
  onClick,
}: {
  isSettling: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
        disabled
          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      }`}
    >
      {isSettling ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          정산 처리 중...
        </span>
      ) : (
        "🎯 정산 실행"
      )}
    </button>
  );
}

function SettlementResult({
  settleResult,
  onGoToPredictions,
}: {
  settleResult: SettlementResultState;
  onGoToPredictions: () => void;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        settleResult.success
          ? "bg-green-900/50 border border-green-500"
          : "bg-red-900/50 border border-red-500"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{settleResult.success ? "🎉" : "❌"}</span>
        <h3 className="text-xl font-bold">
          {settleResult.success ? "정산 완료!" : "정산 실패"}
        </h3>
      </div>
      <p className="text-gray-300 mb-4">{settleResult.message}</p>

      {settleResult.success && settleResult.data && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-green-400 text-sm">승리자</div>
            <div className="text-xl font-bold">{settleResult.data.winnersCount}명</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-red-400 text-sm">패배자</div>
            <div className="text-xl font-bold">{settleResult.data.losersCount}명</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-sm">총 PMC 지급</div>
            <div className="text-xl font-bold">
              {settleResult.data.totalPmcRewarded.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onGoToPredictions}
        className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        예측 목록으로 돌아가기
      </button>
    </div>
  );
}

function ParticipantsList({
  predictions,
  options,
  selectedOptionId,
}: {
  predictions: Prediction[];
  options: OptionStat[];
  selectedOptionId: string | null;
}) {
  if (predictions.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">👥 참여자 목록 ({predictions.length}명)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 px-3">사용자</th>
              <th className="text-left py-2 px-3">선택</th>
              <th className="text-right py-2 px-3">베팅액</th>
              <th className="text-right py-2 px-3">신뢰도</th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 20).map((pred) => {
              const option = options.find((o) => o.id === pred.selectedOptionId);
              const isWinner = pred.selectedOptionId === selectedOptionId;
              const rowClassName = selectedOptionId
                ? isWinner
                  ? "bg-green-900/20"
                  : "bg-red-900/10"
                : "";

              return (
                <tr
                  key={pred.id}
                  className={`border-b border-gray-700/50 ${rowClassName}`}
                >
                  <td className="py-2 px-3 font-mono text-xs">{pred.userId.slice(0, 8)}...</td>
                  <td className="py-2 px-3">{option?.label || pred.selectedOptionId}</td>
                  <td className="py-2 px-3 text-right text-yellow-400">
                    {pred.stakeAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {((pred.confidence || 0.5) * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {predictions.length > 20 && (
          <div className="text-center text-gray-400 text-sm py-3">
            ... 외 {predictions.length - 20}명 더
          </div>
        )}
      </div>
    </div>
  );
}

export function SettlementClient({
  gameId,
  game,
  options,
  totalPool,
  totalParticipants,
  predictions,
  adminUserId,
}: SettlementClientProps) {
  const router = useRouter();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<SettlementResultState | null>(null);

  const isAlreadySettled = game.status === "SETTLED";
  const canSettle = game.status === "ACTIVE" && totalParticipants > 0;

  // 선택된 옵션의 예상 결과 계산
  const selectedOption = options.find((opt) => opt.id === selectedOptionId);
  const winnersCount = selectedOption?.participantCount || 0;
  const losersCount = totalParticipants - winnersCount;
  const estimatedReward = selectedOption
    ? Math.floor(totalPool * REWARD_POOL_RATE) // 90%가 보상 풀 (10% 수수료 가정)
    : 0;

  const isSettleUiEnabled = canSettle && !settleResult?.success;
  const isSettleButtonDisabled = !selectedOptionId || isSettling;

  const buildConfirmText = (): string => {
    const label = selectedOption?.label ?? "(선택되지 않음)";
    return `정말로 "${label}"을(를) 정답으로 정산하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
  };

  const applySuccessResult = (resultData?: SettleApiSuccessData) => {
    setSettleResult({
      success: true,
      message: "정산이 성공적으로 완료되었습니다!",
      data: {
        winnersCount: resultData?.winnersCount ?? winnersCount,
        losersCount: resultData?.losersCount ?? losersCount,
        totalPmcRewarded: resultData?.totalPmcRewarded ?? estimatedReward,
      },
    });
  };

  const applyFailureResult = (message?: string) => {
    setSettleResult({
      success: false,
      message: message || "정산 처리 중 오류가 발생했습니다.",
    });
  };

  const handleSettle = async () => {
    if (!selectedOptionId) {
      alert("정답 옵션을 선택해주세요.");
      return;
    }

    if (!confirm(buildConfirmText())) {
      return;
    }

    setIsSettling(true);
    setSettleResult(null);

    try {
      const result = await postSettlement(gameId, {
        correctOptionId: selectedOptionId,
        adminUserId,
      });

      if (result.success) {
        applySuccessResult(result.data);
        return;
      }

      applyFailureResult(result.error?.message);
    } catch (error) {
      void error;
      applyFailureResult("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <GameHeader
          title={game.title}
          description={game.description}
          category={game.category}
          status={game.status}
        />

        {/* Statistics */}
        <StatsCards
          totalPool={totalPool}
          totalParticipants={totalParticipants}
          optionCount={options.length}
        />

        {/* Already Settled Notice */}
        {isAlreadySettled && <AlreadySettledNotice />}

        {/* No Participants Notice */}
        {!isAlreadySettled && totalParticipants === 0 && <NoParticipantsNotice />}

        {/* Option Selection */}
        {isSettleUiEnabled && (
          <OptionSelection
            options={options}
            selectedOptionId={selectedOptionId}
            isSettling={isSettling}
            onSelect={(id) => setSelectedOptionId(id)}
          />
        )}

        {/* Settlement Preview */}
        {selectedOptionId && !settleResult?.success && (
          <SettlementPreview
            winnersCount={winnersCount}
            losersCount={losersCount}
            estimatedReward={estimatedReward}
          />
        )}

        {/* Settle Button */}
        {isSettleUiEnabled && (
          <SettleButton
            isSettling={isSettling}
            disabled={isSettleButtonDisabled}
            onClick={handleSettle}
          />
        )}

        {/* Settlement Result */}
        {settleResult && (
          <SettlementResult
            settleResult={settleResult}
            onGoToPredictions={() => router.push("/prediction")}
          />
        )}

        {/* Participants List */}
        <ParticipantsList
          predictions={predictions}
          options={options}
          selectedOptionId={selectedOptionId}
        />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          ← 뒤로 가기
        </button>
      </div>
    </div>
  );
}
