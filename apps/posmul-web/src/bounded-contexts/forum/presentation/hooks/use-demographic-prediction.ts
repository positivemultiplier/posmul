/**
 * Demographic Prediction Hooks
 * 인구통계 기반 예측 게임 관련 hooks
 */
"use client";

import { useState, useCallback } from "react";
import {
  StatCategory,
  PeriodType,
} from "../../domain/value-objects/forum-value-objects";

/**
 * 인구통계 토론/예측 데이터 타입
 */
export interface DemographicPrediction {
  id: string;
  postId: string;
  title: string;
  description: string;
  statCategory: StatCategory;
  regionCode: string;
  regionName: string;
  periodType: PeriodType;
  targetYear: number;
  targetMonth?: number;
  targetQuarter?: number;
  rangeMin: number;
  rangeMax: number;
  rangeStep: number;
  unit: string;
  minBetPmp: number;
  maxBetPmp: number;
  deadline: string;
  status: "OPEN" | "CLOSED" | "SETTLED";
  participantCount: number;
  totalBetPmp: number;
  commentCount: number;
  actualValue?: number;
  createdAt: string;
  creatorName: string;
}

/**
 * 사용자의 예측 참여 정보
 */
export interface UserPrediction {
  id: string;
  predictionId: string;
  prediction: number;
  betAmount: number;
  createdAt: string;
  status: "PENDING" | "WON" | "LOST";
  reward?: number;
}

/**
 * API 응답 타입
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 인구통계 예측 게임 목록 조회 Hook
 */
export function useDemographicPredictions() {
  const [predictions, setPredictions] = useState<DemographicPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(
    async (options?: {
      statCategory?: StatCategory;
      regionCode?: string;
      status?: "OPEN" | "CLOSED" | "SETTLED";
      limit?: number;
      offset?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.statCategory) params.set("statCategory", options.statCategory);
        if (options?.regionCode) params.set("regionCode", options.regionCode);
        if (options?.status) params.set("status", options.status);
        if (options?.limit) params.set("limit", options.limit.toString());
        if (options?.offset) params.set("offset", options.offset.toString());

        const response = await fetch(`/api/predictions/demographic?${params.toString()}`);
        const result: ApiResponse<{ predictions: DemographicPrediction[] }> = await response.json();

        if (result.success && result.data) {
          setPredictions(result.data.predictions);
        } else {
          setError(result.error?.message || "예측 게임을 불러오는데 실패했습니다.");
        }
      } catch (_err) {
        setError("서버 연결에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchOpenPredictions = useCallback(
    () => fetchPredictions({ status: "OPEN" }),
    [fetchPredictions]
  );

  return {
    predictions,
    loading,
    error,
    fetchPredictions,
    fetchOpenPredictions,
  };
}

/**
 * 단일 예측 게임 상세 조회 Hook
 */
export function useDemographicPrediction(predictionId: string) {
  const [prediction, setPrediction] = useState<DemographicPrediction | null>(null);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!predictionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/demographic/${predictionId}`);
      const result: ApiResponse<{
        prediction: DemographicPrediction;
        userPredictions: UserPrediction[];
      }> = await response.json();

      if (result.success && result.data) {
        setPrediction(result.data.prediction);
        setUserPredictions(result.data.userPredictions);
      } else {
        setError(result.error?.message || "예측 게임 정보를 불러오는데 실패했습니다.");
      }
    } catch (_err) {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [predictionId]);

  const participate = useCallback(
    async (
      predictedValue: number,
      betAmount: number
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(`/api/predictions/demographic/${predictionId}/participate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction: predictedValue, betAmount }),
        });

        const result: ApiResponse<{
          participationId: string;
          pmpDeducted: number;
        }> = await response.json();

        if (result.success) {
          // Refresh prediction data
          await fetchPrediction();
          return { success: true };
        } else {
          return {
            success: false,
            error: result.error?.message || "참여에 실패했습니다.",
          };
        }
      } catch (_err) {
        return { success: false, error: "서버 연결에 실패했습니다." };
      }
    },
    [predictionId, fetchPrediction]
  );

  return {
    prediction,
    userPredictions,
    loading,
    error,
    fetchPrediction,
    participate,
  };
}

/**
 * 인구통계 예측 게임 생성 Hook
 */
export function useCreateDemographicPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPrediction = useCallback(
    async (data: {
      postId: string;
      statCategory: StatCategory;
      regionCode: string;
      periodType: PeriodType;
      targetYear: number;
      targetMonth?: number;
      targetQuarter?: number;
      rangeMin: number;
      rangeMax: number;
      rangeStep: number;
      minBetPmp: number;
      maxBetPmp: number;
      deadline: Date;
    }): Promise<{ success: boolean; predictionId?: string; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/predictions/demographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            deadline: data.deadline.toISOString(),
          }),
        });

        const result: ApiResponse<{
          predictionId: string;
          linkId: string;
        }> = await response.json();

        if (result.success && result.data) {
          return { success: true, predictionId: result.data.predictionId };
        } else {
          const errorMsg = result.error?.message || "예측 게임 생성에 실패했습니다.";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (_err) {
        const errorMsg = "서버 연결에 실패했습니다.";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createPrediction,
  };
}

/**
 * 사용자의 예측 참여 내역 Hook
 */
export function useMyPredictions() {
  const [predictions, setPredictions] = useState<
    Array<DemographicPrediction & { myPrediction: UserPrediction }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPredictions = useCallback(
    async (status?: "PENDING" | "WON" | "LOST") => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);

        const response = await fetch(`/api/predictions/my?${params.toString()}`);
        const result: ApiResponse<{
          predictions: Array<DemographicPrediction & { myPrediction: UserPrediction }>;
        }> = await response.json();

        if (result.success && result.data) {
          setPredictions(result.data.predictions);
        } else {
          setError(result.error?.message || "내 예측 내역을 불러오는데 실패했습니다.");
        }
      } catch (_err) {
        setError("서버 연결에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    predictions,
    loading,
    error,
    fetchMyPredictions,
  };
}

/**
 * 인구통계 데이터 조회 Hook (KOSIS)
 */
export function useDemographicData() {
  const [data, setData] = useState<
    Array<{
      id: string;
      category: StatCategory;
      regionCode: string;
      regionName: string;
      year: number;
      month?: number;
      value: number;
      unit: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (options: {
      category: StatCategory;
      regionCode: string;
      year: number;
      month?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("category", options.category);
        params.set("regionCode", options.regionCode);
        params.set("year", options.year.toString());
        if (options.month) params.set("month", options.month.toString());

        const response = await fetch(`/api/demographic-data?${params.toString()}`);
        const result: ApiResponse<{
          data: Array<{
            id: string;
            category: StatCategory;
            regionCode: string;
            regionName: string;
            year: number;
            month?: number;
            value: number;
            unit: string;
          }>;
        }> = await response.json();

        if (result.success && result.data) {
          setData(result.data.data);
        } else {
          setError(result.error?.message || "통계 데이터를 불러오는데 실패했습니다.");
        }
      } catch (_err) {
        setError("서버 연결에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchData,
  };
}
