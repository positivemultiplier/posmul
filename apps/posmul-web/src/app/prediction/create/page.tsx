"use client";

/**
 * 예측 게임 생성 페이지
 * Server Actions를 활용한 폼 처리 예시
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

import { PredictionGameForm } from "../../../shared/ui";

type PredictionTypeInput = "binary" | "multiple" | "numeric";

type PredictionGameFormData = {
  title: string;
  description: string;
  predictionType: PredictionTypeInput;
  options: string[];
  endTime: string;
  settlementTime: string;
  minimumStake: number;
  maximumStake: number;
};

export default function CreatePredictionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (data: PredictionGameFormData) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/prediction/user-proposed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          predictionType: data.predictionType,
          options: data.options,
          endTime: data.endTime,
          settlementTime: data.settlementTime,
          minimumStake: data.minimumStake,
          maximumStake: data.maximumStake,
        }),
      });

      const json = (await res.json()) as
        | {
            success: true;
            data: { slug: string; subcategory: string; league: string };
          }
        | { success: false; error: { message: string } };

      if (!res.ok || !json.success) {
        const message =
          "success" in json && json.success === false
            ? json.error.message
            : "Create failed";
        throw new Error(message);
      }

      router.push(
        `/prediction/user-suggestions/${json.data.subcategory}/${json.data.league}/${json.data.slug}`
      );
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 새로운 예측 게임 만들기
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Agency Theory를 활용한 PosMul 예측 게임을 생성하세요.
            <br />
            참여자들이 PmpAmount를 사용하여 예측에 참여할 수 있습니다.
          </p>
        </div>

        <PredictionGameForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* 도움말 섹션 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              📋 게임 생성 가이드
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">
                  📝 좋은 게임 제목
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 구체적이고 명확한 제목</li>
                  <li>• 예측 대상과 기간 명시</li>
                  <li>• 흥미를 유발하는 표현</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">
                  💰 베팅 금액 설정
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 최소 100 PmpAmount ~ 최대 10,000 PmpAmount</li>
                  <li>• 게임 난이도에 따라 조정</li>
                  <li>• 참여 장벽을 고려한 설정</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
