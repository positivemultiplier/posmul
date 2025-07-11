"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { PredictionGame } from "../../../../bounded-contexts/prediction/domain/types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "../base";

const formSchema = z.object({
  title: z.string().min(10, "제목은 10자 이상이어야 합니다."),
  description: z.string().min(20, "설명은 20자 이상이어야 합니다."),
  predictionType: z.enum(["binary", "multiple", "numeric"]),
  options: z.array(z.string()).min(2, "최소 2개의 선택지가 필요합니다."),
  endTime: z.string().min(1, "종료 시간을 선택해주세요."),
  settlementTime: z.string().min(1, "정산 시간을 선택해주세요."),
  minimumStake: z.number().min(1, "최소 참여 금액은 1 PmpAmount 이상이어야 합니다."),
  maximumStake: z.number().min(1, "최대 참여 금액은 1 PmpAmount 이상이어야 합니다."),
});

type PredictionGameFormData = z.infer<typeof formSchema>;

interface PredictionGameFormProps {
  onSubmit: (data: PredictionGameFormData) => Promise<void>;
  initialData?: Partial<PredictionGame>;
  isLoading?: boolean;
}

export default function PredictionGameForm({
  onSubmit,
  initialData,
  isLoading = false,
}: PredictionGameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PredictionGameFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit: SubmitHandler<PredictionGameFormData> = async (
    data: PredictionGameFormData
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
        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="predictionType" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* 종료 시간 */}
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="settlementTime" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* 최소/최대 참여 금액 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minimumStake" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="maximumStake" className="block text-sm font-medium text-gray-700 mb-2">
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
