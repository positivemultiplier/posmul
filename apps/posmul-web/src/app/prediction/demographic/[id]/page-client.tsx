/**
 * Prediction Detail Client Component
 * 예측 게임 상세 및 참여 클라이언트 컴포넌트
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  MessageSquare,
  Share2,
  Bookmark,
  AlertCircle,
} from "lucide-react";
import {
  StatCategory,
  PeriodType,
} from "@/bounded-contexts/forum/domain/value-objects/forum-value-objects";

/**
 * 통계 카테고리 설정
 */
const STAT_CONFIG: Record<StatCategory, { icon: string; label: string; color: string; bgColor: string }> = {
  [StatCategory.BIRTH]: { icon: "👶", label: "출생아 수", color: "text-pink-600", bgColor: "bg-pink-50" },
  [StatCategory.DEATH]: { icon: "🕯️", label: "사망자 수", color: "text-gray-600", bgColor: "bg-gray-50" },
  [StatCategory.MARRIAGE]: { icon: "💍", label: "혼인 건수", color: "text-red-500", bgColor: "bg-red-50" },
  [StatCategory.DIVORCE]: { icon: "💔", label: "이혼 건수", color: "text-purple-600", bgColor: "bg-purple-50" },
  [StatCategory.MIGRATION_IN]: { icon: "🏠", label: "전입자 수", color: "text-green-600", bgColor: "bg-green-50" },
  [StatCategory.MIGRATION_OUT]: { icon: "🚚", label: "전출자 수", color: "text-orange-600", bgColor: "bg-orange-50" },
  [StatCategory.EMPLOYMENT]: { icon: "💼", label: "취업률", color: "text-blue-600", bgColor: "bg-blue-50" },
  [StatCategory.UNEMPLOYMENT]: { icon: "📉", label: "실업률", color: "text-red-600", bgColor: "bg-red-50" },
  [StatCategory.LABOR_FORCE]: { icon: "👷", label: "경제활동인구", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  [StatCategory.CPI]: { icon: "📊", label: "소비자물가지수", color: "text-amber-600", bgColor: "bg-amber-50" },
  [StatCategory.POPULATION]: { icon: "👥", label: "총 인구", color: "text-teal-600", bgColor: "bg-teal-50" },
};

/**
 * 샘플 예측 게임 데이터
 */
const SAMPLE_PREDICTION = {
  id: "1",
  title: "12월 광주시 출생아 수 예측",
  description: `저출산 추세 속 12월 광주시 출생아 수를 예측해보세요.

## 배경
- 2024년 광주시 월평균 출생아 수: 약 950명
- 11월 출생아 수: 923명 (전월 대비 -2.3%)
- 계절적 요인: 12월은 연중 출생이 적은 편

## 고려 사항
- 저출산 추세 지속
- 연말 계절적 요인
- 경기 침체 영향

정확한 예측으로 PMC 보상을 획득하세요!`,
  statCategory: StatCategory.BIRTH,
  regionCode: "29000",
  regionName: "광주광역시",
  periodType: PeriodType.MONTHLY,
  targetYear: 2025,
  targetMonth: 12,
  rangeMin: 800,
  rangeMax: 1200,
  rangeStep: 50,
  unit: "명",
  minBetPmp: 50,
  maxBetPmp: 500,
  deadline: new Date("2025-12-25"),
  status: "OPEN" as const,
  participantCount: 24,
  totalBetPmp: 4800,
  commentCount: 18,
  createdAt: new Date("2025-11-28"),
  creatorName: "데이터분석러",
  // 배팅 분포
  distribution: [
    { range: "800-850", count: 2, pmp: 300 },
    { range: "850-900", count: 5, pmp: 850 },
    { range: "900-950", count: 8, pmp: 1600 },
    { range: "950-1000", count: 6, pmp: 1200 },
    { range: "1000-1050", count: 2, pmp: 500 },
    { range: "1050-1100", count: 1, pmp: 350 },
  ],
};

interface PredictionDetailClientProps {
  predictionId: string;
}

export function PredictionDetailClient({ predictionId: _predictionId }: PredictionDetailClientProps) {
  const _router = useRouter();
  const [prediction] = useState(SAMPLE_PREDICTION);
  const [selectedValue, setSelectedValue] = useState<number>(950);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_showParticipateForm, _setShowParticipateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const config = STAT_CONFIG[prediction.statCategory];
  const isOpen = prediction.status === "OPEN";

  // 예측값 옵션 생성
  const predictionOptions: number[] = [];
  for (let v = prediction.rangeMin; v <= prediction.rangeMax; v += prediction.rangeStep) {
    predictionOptions.push(v);
  }

  // 남은 시간 계산
  const getTimeRemaining = () => {
    const now = new Date();
    const diff = prediction.deadline.getTime() - now.getTime();
    if (diff <= 0) return "마감됨";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}일 ${hours}시간 ${minutes}분`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    // 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSuccess(true);
    _setShowParticipateForm(false);
  }, []);

  // 최대 배팅 분포 찾기 (차트 스케일링용)
  const maxDistribution = Math.max(...prediction.distribution.map((d) => d.count));

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/forum/debate"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        토론 목록으로
      </Link>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              ✅
            </div>
            <div>
              <h3 className="font-semibold text-green-900">예측 참여 완료!</h3>
              <p className="text-green-700 text-sm">
                {selectedValue}{prediction.unit}에 {betAmount} PMP를 배팅했습니다.
                결과 발표 후 보상이 지급됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Category Header */}
        <div className={`${config.bgColor} px-6 py-4 border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <span className={`font-semibold ${config.color}`}>{config.label}</span>
                <span className="text-gray-500 text-sm ml-2">{prediction.regionName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-white/50 transition-colors">
                <Bookmark className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{prediction.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>작성자: {prediction.creatorName}</span>
            <span>•</span>
            <span>{new Date(prediction.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-1">
                <Users className="w-4 h-4" /> 참여자
              </div>
              <div className="text-xl font-bold text-gray-900">{prediction.participantCount}명</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-1">
                <TrendingUp className="w-4 h-4" /> 총 배팅
              </div>
              <div className="text-xl font-bold text-green-600">
                {prediction.totalBetPmp.toLocaleString()} PMP
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-1">
                <MessageSquare className="w-4 h-4" /> 토론
              </div>
              <div className="text-xl font-bold text-gray-900">{prediction.commentCount}개</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" /> 마감까지
              </div>
              <div className="text-xl font-bold text-orange-600">{getTimeRemaining()}</div>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-gray max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-700">{prediction.description}</div>
          </div>

          {/* Prediction Range Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">📊 예측 범위</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">최소값:</span>
                <span className="ml-2 font-bold text-blue-900">
                  {prediction.rangeMin.toLocaleString()} {prediction.unit}
                </span>
              </div>
              <div>
                <span className="text-blue-700">최대값:</span>
                <span className="ml-2 font-bold text-blue-900">
                  {prediction.rangeMax.toLocaleString()} {prediction.unit}
                </span>
              </div>
              <div>
                <span className="text-blue-700">단위:</span>
                <span className="ml-2 font-bold text-blue-900">
                  {prediction.rangeStep} {prediction.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📈 현재 배팅 분포</h3>
            <div className="space-y-2">
              {prediction.distribution.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{item.range}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}명</span>
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right text-gray-500">
                    {item.pmp.toLocaleString()} PMP
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Participate Form */}
      {isOpen && !success && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">🎯 예측 참여하기</h2>
            <p className="text-green-100 text-sm">
              예측값을 선택하고 PMP를 배팅하세요
            </p>
          </div>

          <div className="p-6">
            {/* Prediction Value Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예측값 선택
              </label>
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {predictionOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString()} {prediction.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Bet Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배팅 금액 (PMP)
              </label>
              <div className="flex gap-2 mb-2">
                {[50, 100, 200, 300, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      betAmount === amount
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={prediction.minBetPmp}
                max={prediction.maxBetPmp}
                step={10}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{prediction.minBetPmp} PMP</span>
                <span className="font-medium text-green-600">{betAmount} PMP</span>
                <span>{prediction.maxBetPmp} PMP</span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-800 mb-2">예측 요약</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">예측값:</span>
                  <span className="font-bold text-green-900">
                    {selectedValue.toLocaleString()} {prediction.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">배팅:</span>
                  <span className="font-bold text-green-900">{betAmount} PMP</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  참여 중...
                </span>
              ) : (
                `${betAmount} PMP 배팅하기`
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              참여 후에는 취소할 수 없습니다. 신중하게 선택해주세요.
            </p>
          </div>
        </div>
      )}

      {/* Closed Message */}
      {!isOpen && (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            이 예측 게임은 마감되었습니다
          </h3>
          <p className="text-gray-500">결과 발표를 기다려주세요.</p>
        </div>
      )}
    </div>
  );
}
