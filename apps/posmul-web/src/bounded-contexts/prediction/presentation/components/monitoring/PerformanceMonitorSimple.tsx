import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, ClockIcon, CpuChipIcon, ExclamationTriangleIcon, ArrowPathIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';

import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';

export function PerformanceMonitor() {
  const {
    metrics,
    isRecording,
    startRecording,
    stopRecording,
    resetMetrics,
    measureWebVitals,
    getPerformanceScore,
    getRecommendations,
  } = usePerformanceMetrics();

  const [activeTab, setActiveTab] = useState('overview');

  const webVitals = measureWebVitals();
  const performanceScore = getPerformanceScore();
  const recommendations = getRecommendations();

  // 성능 점수에 따른 색상
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">성능 모니터링</h1>
            <p className="text-gray-600 mt-2">애플리케이션의 성능 지표를 실시간으로 모니터링합니다</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}
              <span className="text-sm text-gray-500 font-normal">/100</span>
            </div>

            <div className="flex space-x-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>모니터링 시작</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopIcon className="h-4 w-4" />
                  <span>모니터링 중지</span>
                </button>
              )}

              <button
                onClick={resetMetrics}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>초기화</span>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: '개요', icon: ChartBarIcon },
              { key: 'metrics', label: '상세 지표', icon: CpuChipIcon },
              { key: 'history', label: '히스토리', icon: ClockIcon },
              { key: 'recommendations', label: '권장사항', icon: ExclamationTriangleIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 메트릭 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Page Load Time */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <div className="flex items-center space-x-2 mb-4">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-700">페이지 로드 시간</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {Math.round(metrics.pageLoadTime)} <span className="text-sm text-gray-500">ms</span>
                  </div>
                </div>

                {/* Memory Usage */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <div className="flex items-center space-x-2 mb-4">
                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-700">메모리 사용량</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {Math.round(metrics.memoryUsage)} <span className="text-sm text-gray-500">MB</span>
                  </div>
                </div>

                {/* Component Renders */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <div className="flex items-center space-x-2 mb-4">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-700">컴포넌트 렌더링</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {metrics.componentRenderCount}
                  </div>
                </div>

                {/* Error Count */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <div className="flex items-center space-x-2 mb-4">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <h3 className="text-sm font-medium text-gray-700">에러 수</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {metrics.errorCount}
                  </div>
                </div>
              </div>

              {/* Web Vitals */}
              {webVitals && (
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(webVitals.FCP)}ms</div>
                      <div className="text-sm text-gray-500">FCP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(webVitals.LCP)}ms</div>
                      <div className="text-sm text-gray-500">LCP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(webVitals.TTFB)}ms</div>
                      <div className="text-sm text-gray-500">TTFB</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(webVitals.FID)}ms</div>
                      <div className="text-sm text-gray-500">FID</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{webVitals.CLS.toFixed(3)}</div>
                      <div className="text-sm text-gray-500">CLS</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {recommendations.length > 0 ? (
                recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      recommendation.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      recommendation.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                      recommendation.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 text-orange-600" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium capitalize">{recommendation.type}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            recommendation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            recommendation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            recommendation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {recommendation.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{recommendation.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">권장사항 없음</h3>
                  <p className="mt-1 text-sm text-gray-500">현재 성능 지표가 양호합니다</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default PerformanceMonitor;
