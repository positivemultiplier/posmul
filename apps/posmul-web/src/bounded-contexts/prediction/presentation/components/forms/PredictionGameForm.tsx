"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Button, Card } from "../../../../../shared/ui/components/base";

import {
  userProposedPredictionGameRequestSchema,
  type UserProposedPredictionGameRequest,
} from "../../../application/dto/user-proposed-prediction-game.dto";

interface PredictionGameFormProps {
  onSubmit: (data: UserProposedPredictionGameRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function PredictionGameForm({
  onSubmit,
  isLoading = false,
}: PredictionGameFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserProposedPredictionGameRequest>({
    resolver: zodResolver(userProposedPredictionGameRequestSchema),
    defaultValues: {
      predictionType: "binary",
      options: ["예", "아니오"],
      minimumStake: 1,
      maximumStake: 1,
    },
  });

  const predictionType = watch("predictionType");

  const handleFormSubmit: SubmitHandler<UserProposedPredictionGameRequest> = async (
    data: UserProposedPredictionGameRequest
  ) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎯 예측 게임 생성
        </h2>
        <p className="text-gray-600">
          새로운 예측 게임을 만들어 참여자들과 예측을 공유하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 기본 옵션: binary는 예/아니오 고정 */}
        {predictionType === "binary" && (
          <>
            <input type="hidden" defaultValue="예" {...register("options.0")} />
            <input type="hidden" defaultValue="아니오" {...register("options.1")} />
          </>
        )}

        {/* 제목 */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            게임 제목 *
          </label>
          <input
            {...register("title")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 2024년 월드컵 우승팀 예측"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* 설명 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            게임 설명 *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="게임에 대한 자세한 설명을 입력하세요..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* 예측 타입 */}
        <div>
          <label
            htmlFor="predictionType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            예측 타입 *
          </label>
          <select
            {...register("predictionType")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">타입을 선택하세요</option>
            <option value="binary">예/아니오 (이진 선택)</option>
            <option value="multiple">다중 선택</option>
            <option value="numeric">숫자 예측</option>
          </select>
          {errors.predictionType && (
            <p className="mt-1 text-sm text-red-600">{errors.predictionType.message}</p>
          )}
        </div>

        {/* 선택지 (binary 외 타입에서 입력) */}
        {predictionType !== "binary" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              선택지 *
            </label>
            <div className="space-y-2">
              <input
                {...register("options.0")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선택지 1"
              />
              <input
                {...register("options.1")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선택지 2"
              />
              <input
                {...register("options.2")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선택지 3 (선택)"
              />
              <input
                {...register("options.3")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선택지 4 (선택)"
              />
            </div>
            {errors.options && (
              <p className="mt-1 text-sm text-red-600">{errors.options.message}</p>
            )}
          </div>
        )}

        {/* 종료 시간 */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            예측 종료 시간 *
          </label>
          <input
            {...register("endTime")}
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
          )}
        </div>

        {/* 정산 시간 */}
        <div>
          <label
            htmlFor="settlementTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            결과 정산 시간 *
          </label>
          <input
            {...register("settlementTime")}
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.settlementTime && (
            <p className="mt-1 text-sm text-red-600">{errors.settlementTime.message}</p>
          )}
        </div>

        {/* 정산 방법 */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">⚙️ 정산 설정</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 정산 유형 */}
            <div>
              <label
                htmlFor="settlementType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                정산 방식
              </label>
              <select
                {...register("settlementType")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">수동 정산</option>
                <option value="semi_auto">반자동 (확인 후 정산)</option>
                <option value="auto">자동 정산</option>
              </select>
            </div>

            {/* 정산 소스 */}
            <div>
              <label
                htmlFor="settlementSourceType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                데이터 소스
              </label>
              <select
                {...register("settlementSourceType")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">직접 입력</option>
                <option value="football_data">⚽ 축구 (football-data.org)</option>
                <option value="thesportsdb">🏆 스포츠 (TheSportsDB)</option>
                <option value="kosis">📊 경제지표 (KOSIS)</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            💡 자동/반자동 정산 시 외부 API에서 결과를 가져와 정산합니다.
          </p>
        </div>

        {/* 최소/최대 참여 금액 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="minimumStake"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              최소 참여 금액 (PmpAmount) *
            </label>
            <input
              {...register("minimumStake", { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.minimumStake && (
              <p className="mt-1 text-sm text-red-600">{errors.minimumStake.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="maximumStake"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              최대 참여 금액 (PmpAmount) *
            </label>
            <input
              {...register("maximumStake", { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.maximumStake && (
              <p className="mt-1 text-sm text-red-600">{errors.maximumStake.message}</p>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="default"
            onClick={() => window.history.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "생성 중..." : "게임 생성"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
