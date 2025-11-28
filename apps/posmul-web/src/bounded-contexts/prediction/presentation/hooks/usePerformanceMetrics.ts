import { useCallback, useEffect, useState } from "react";

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    componentRenderCount: 0,
    apiResponseTimes: [],
    memoryUsage: 0,
    errorCount: 0,
    userInteractions: 0,
    timestamp: Date.now(),
  });

  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);

  // 페이지 로드 시간 측정
  useEffect(() => {
    if (typeof window !== "undefined" && window.performance) {
      const navigationEntries =
        window.performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const navigationTiming = navigationEntries[0];
        const timing = navigationTiming;
        // @ts-ignore
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        setMetrics((prev) => ({ ...prev, pageLoadTime: loadTime || 0 }));
      }
    }
  }, []);

  // 메모리 사용량 모니터링
  useEffect(() => {
    if (isRecording && typeof window !== "undefined") {
      const performanceAny = window.performance;
      // @ts-ignore
      if (performanceAny?.memory) {
        const interval = setInterval(() => {
          // @ts-ignore
          const memoryInfo = performanceAny.memory;
          setMetrics((prev) => ({
            ...prev,
            memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024, // MB 단위
          }));
        }, 5000);

        return () => clearInterval(interval);
      }
    }
  }, [isRecording]);

  // 컴포넌트 렌더링 추적
  const incrementRenderCount = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      componentRenderCount: prev.componentRenderCount + 1,
    }));
  }, []);

  // API 응답 시간 추적
  const trackApiCall = useCallback((url, responseTime) => {
    setMetrics((prev) => ({
      ...prev,
      apiResponseTimes: [
        ...prev.apiResponseTimes.slice(-19),
        { url, responseTime, timestamp: Date.now() },
      ],
    }));
  }, []);

  // 에러 추적
  const trackError = useCallback((_error, _context) => {
    setMetrics((prev) => ({
      ...prev,
      errorCount: prev.errorCount + 1,
    }));

    // 에러 로깅 (실제 환경에서는 외부 서비스로 전송)
    if (process.env.NODE_ENV === "development") {
      // Development 환경에서만 로깅
    }
  }, []);

  // 사용자 상호작용 추적
  const trackInteraction = useCallback((_type, _element) => {
    setMetrics((prev) => ({
      ...prev,
      userInteractions: prev.userInteractions + 1,
    }));
  }, []);

  // 메트릭 기록 시작/중지
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setMetrics((prev) => ({ ...prev, timestamp: Date.now() }));
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    // 현재 메트릭을 히스토리에 저장
    setHistory((prev) => [
      ...prev.slice(-99),
      { ...metrics, timestamp: Date.now() },
    ]);
  }, [metrics]);

  // 메트릭 초기화
  const resetMetrics = useCallback(() => {
    setMetrics({
      pageLoadTime: 0,
      componentRenderCount: 0,
      apiResponseTimes: [],
      memoryUsage: 0,
      errorCount: 0,
      userInteractions: 0,
      timestamp: Date.now(),
    });
  }, []);

  // Web Vitals 측정
  const measureWebVitals = useCallback(() => {
    if (typeof window === "undefined" || !window.performance) {
      return null;
    }

    const navigation = window.performance.getEntriesByType("navigation")[0];
    const paint = window.performance.getEntriesByType("paint");

    const fcp =
      paint.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime || 0;
    const lcp =
      paint.find((entry) => entry.name === "largest-contentful-paint")
        ?.startTime || 0;

    return {
      FCP: fcp, // First Contentful Paint
      LCP: lcp, // Largest Contentful Paint
      // @ts-ignore
      TTFB: navigation?.responseStart - navigation?.navigationStart || 0, // Time to First Byte
      FID: 0, // First Input Delay (requires user interaction)
      CLS: 0, // Cumulative Layout Shift (complex to calculate)
    };
  }, []);

  // 성능 점수 계산
  const getPerformanceScore = useCallback(() => {
    const vitals = measureWebVitals();
    if (!vitals) return 0;

    let score = 100;

    // FCP 점수 (0-2.5s = 100점, 2.5-4s = 감점, 4s+ = 0점)
    if (vitals.FCP > 4000) score -= 30;
    else if (vitals.FCP > 2500) score -= ((vitals.FCP - 2500) / 1500) * 30;

    // 메모리 사용량 점수 (50MB 이하 = 100점)
    if (metrics.memoryUsage > 100) score -= 20;
    else if (metrics.memoryUsage > 50)
      score -= ((metrics.memoryUsage - 50) / 50) * 20;

    // API 응답 시간 점수
    const avgApiTime =
      metrics.apiResponseTimes.length > 0
        ? metrics.apiResponseTimes.reduce(
            (sum, api) => sum + api.responseTime,
            0
          ) / metrics.apiResponseTimes.length
        : 0;

    if (avgApiTime > 2000) score -= 25;
    else if (avgApiTime > 1000) score -= ((avgApiTime - 1000) / 1000) * 25;

    // 에러 점수
    if (metrics.errorCount > 5) score -= 25;
    else if (metrics.errorCount > 0) score -= metrics.errorCount * 5;

    return Math.max(0, Math.round(score));
  }, [metrics, measureWebVitals]);

  // 권장사항 생성
  const getRecommendations = useCallback(() => {
    const recommendations = [];
    const vitals = measureWebVitals();

    if (vitals?.FCP > 2500) {
      recommendations.push({
        type: "performance",
        severity: "high",
        message:
          "First Contentful Paint가 느립니다. 이미지 최적화와 코드 스플리팅을 고려하세요.",
      });
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push({
        type: "memory",
        severity: "medium",
        message:
          "메모리 사용량이 높습니다. 불필요한 컴포넌트 마운트를 확인하세요.",
      });
    }

    if (metrics.apiResponseTimes.length > 0) {
      const avgTime =
        metrics.apiResponseTimes.reduce(
          (sum, api) => sum + api.responseTime,
          0
        ) / metrics.apiResponseTimes.length;
      if (avgTime > 1000) {
        recommendations.push({
          type: "api",
          severity: "high",
          message:
            "API 응답 시간이 느립니다. 캐싱 또는 API 최적화를 검토하세요.",
        });
      }
    }

    if (metrics.errorCount > 3) {
      recommendations.push({
        type: "error",
        severity: "critical",
        message: "에러 발생률이 높습니다. 에러 처리 로직을 검토하세요.",
      });
    }

    return recommendations;
  }, [metrics, measureWebVitals]);

  return {
    metrics,
    history,
    isRecording,

    // 액션
    startRecording,
    stopRecording,
    resetMetrics,
    incrementRenderCount,
    trackApiCall,
    trackError,
    trackInteraction,

    // 분석
    measureWebVitals,
    getPerformanceScore,
    getRecommendations,
  };
}

export default usePerformanceMetrics;
