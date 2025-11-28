import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, ClockIcon, CpuChipIcon, ExclamationTriangleIcon, ArrowPathIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';

export function PerformanceMonitor() {
  const {
    metrics,
    history,
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

  // 메트릭 카드 컴포넌트
  const MetricCard = ({ icon: Icon, title, value, unit, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-lg border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {value} {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </motion.div>
  );

  // 권장사항 카드
  const RecommendationCard = ({ recommendation }) => {
    const severityColors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50',
    };

    return (
      <div className={`border rounded-lg p-4 ${severityColors[recommendation.severity] || 'border-gray-200'}`}>
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
    );
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
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
              {/* Web Vitals 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  icon={ClockIcon}
                  title="First Contentful Paint"
                  value={webVitals?.FCP ? Math.round(webVitals.FCP) : 0}
                  unit="ms"
                  description="첫 번째 콘텐츠 렌더링 시간"
                />
                <MetricCard
                  icon={ChartBarIcon}
                  title="Memory Usage"
                  value={Math.round(metrics.memoryUsage)}
                  unit="MB"
                  description="현재 메모리 사용량"
                />
                <MetricCard
                  icon={CpuChipIcon}
                  title="Component Renders"
                  value={metrics.componentRenderCount}
                  unit="회"
                  description="컴포넌트 렌더링 횟수"
                />
                <MetricCard
                  icon={ExclamationTriangleIcon}
                  title="Error Count"
                  value={metrics.errorCount}
                  unit="건"
                  description="발생한 에러 수"
                />
              </div>

              {/* API 응답 시간 차트 */}
              {metrics.apiResponseTimes.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">API 응답 시간</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.apiResponseTimes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(time) => new Date(time).toLocaleString()}
                          formatter={(value) => [`${value}ms`, 'Response Time']}
                        />
                        <Line type="monotone" dataKey="responseTime" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Web Vitals 상세 */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
                  <div className="space-y-4">
                    {webVitals && Object.entries(webVitals).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{key}</span>
                        <span className="text-sm text-gray-600">{Math.round(value)}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 성능 분포 */}
                <div className="bg-white rounded-lg p-6 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">성능 분포</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '우수', value: performanceScore >= 90 ? 1 : 0, color: '#10B981' },
                            { name: '보통', value: performanceScore >= 70 && performanceScore < 90 ? 1 : 0, color: '#F59E0B' },
                            { name: '개선 필요', value: performanceScore < 70 ? 1 : 0, color: '#EF4444' },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[
                            { color: '#10B981' },
                            { color: '#F59E0B' },
                            { color: '#EF4444' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {history.length > 0 ? (
                <div className="bg-white rounded-lg shadow-lg border">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">성능 히스토리</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(time) => new Date(time).toLocaleString()}
                          />
                          <Area type="monotone" dataKey="memoryUsage" stackId="1" stroke="#8884d8" fill="#8884d8" />
                          <Area type="monotone" dataKey="errorCount" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">히스토리 없음</h3>
                  <p className="mt-1 text-sm text-gray-500">모니터링을 시작하고 중지하여 히스토리를 생성하세요</p>
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
                  <RecommendationCard key={index} recommendation={recommendation} />
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
