import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function ChartWidget(props) {
  const {
    gameId,
    type,
    title,
    data = [],
    height = 300,
    className = ''
  } = props;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Mock 데이터 생성 (실제 환경에서는 API 호출)
  useEffect(() => {
    const generateMockData = () => {
      setLoading(true);

      setTimeout(() => {
        switch (type) {
          case 'probability':
            setChartData(generateProbabilityData());
            break;
          case 'betting':
            setChartData(generateBettingData());
            break;
          case 'participants':
            setChartData(generateParticipantData());
            break;
          case 'timeline':
            setChartData(generateTimelineData());
            break;
          default:
            setChartData([]);
        }
        setLoading(false);
      }, Math.random() * 1000 + 500); // 0.5-1.5초 랜덤 로딩
    };

    generateMockData();
  }, [gameId, type]);

  const generateProbabilityData = () => {
    const dataPoints = 20;
    const data = [];
    const baseTime = Date.now() - (dataPoints * 30 * 60 * 1000); // 30분 간격

    for (let i = 0; i < dataPoints; i++) {
      const time = new Date(baseTime + i * 30 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: time.getTime(),
        option1: 35 + Math.random() * 30 + Math.sin(i * 0.5) * 10,
        option2: 40 + Math.random() * 25 + Math.cos(i * 0.3) * 8,
        option3: 25 + Math.random() * 20 + Math.sin(i * 0.8) * 5,
        totalParticipants: Math.floor(100 + i * 15 + Math.random() * 50)
      });
    }

    return data;
  };

  const generateBettingData = () => {
    return [
      {
        optionName: '승리',
        amount: 1250000,
        percentage: 45,
        participants: 156,
        color: '#10b981'
      },
      {
        optionName: '무승부',
        amount: 800000,
        percentage: 30,
        participants: 89,
        color: '#f59e0b'
      },
      {
        optionName: '패배',
        amount: 650000,
        percentage: 25,
        participants: 67,
        color: '#ef4444'
      }
    ];
  };

  const generateParticipantData = () => {
    const hours = 24;
    const data = [];

    for (let i = 0; i < hours; i++) {
      data.push({
        hour: `${i}:00`,
        participants: Math.floor(10 + Math.random() * 50 + Math.sin(i * 0.5) * 20),
        newUsers: Math.floor(Math.random() * 15),
        returningUsers: Math.floor(Math.random() * 35)
      });
    }

    return data;
  };

  const generateTimelineData = () => {
    const events = [
      { time: '09:00', event: '게임 시작', type: 'start', value: 100 },
      { time: '10:30', event: '첫 베팅 급증', type: 'surge', value: 280 },
      { time: '12:00', event: '점심시간 침체', type: 'low', value: 150 },
      { time: '14:00', event: '오후 활성화', type: 'surge', value: 320 },
      { time: '16:30', event: '마감 전 러시', type: 'peak', value: 450 },
      { time: '18:00', event: '게임 마감', type: 'end', value: 200 }
    ];

    return events;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <p>차트 로딩 중 오류가 발생했습니다</p>
        </div>
      );
    }

    switch (type) {
      case 'probability':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="option1"
                stroke="#10b981"
                strokeWidth={3}
                name="옵션 1"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="option2"
                stroke="#3b82f6"
                strokeWidth={3}
                name="옵션 2"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              {chartData[0]?.option3 !== undefined && (
                <Line
                  type="monotone"
                  dataKey="option3"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="옵션 3"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'betting':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString()}원`,
                  '베팅 금액'
                ]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'participants':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="participants"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="참여자 수"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [
                  `${value}명`,
                  props.payload?.event || '활동'
                ]}
              />
              <Bar
                dataKey="value"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>지원하지 않는 차트 타입입니다.</div>;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'probability': return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'betting': return <ChartBarIcon className="h-5 w-5" />;
      case 'participants': return <UsersIcon className="h-5 w-5" />;
      case 'timeline': return <ClockIcon className="h-5 w-5" />;
      default: return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const getStats = useMemo(() => {
    if (!chartData.length) return null;

    switch (type) {
      case 'probability':
        const latestProb = chartData[chartData.length - 1];
        return [
          { label: '총 참여자', value: latestProb?.totalParticipants || 0 },
          { label: '최고 확률', value: `${Math.max(latestProb?.option1 || 0, latestProb?.option2 || 0).toFixed(1)}%` }
        ];

      case 'betting':
        const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);
        const totalParticipants = chartData.reduce((sum, item) => sum + item.participants, 0);
        return [
          { label: '총 베팅액', value: `${totalAmount.toLocaleString()}원` },
          { label: '참여자 수', value: `${totalParticipants}명` }
        ];

      case 'participants':
        const maxParticipants = Math.max(...chartData.map(item => item.participants));
        const avgParticipants = Math.round(chartData.reduce((sum, item) => sum + item.participants, 0) / chartData.length);
        return [
          { label: '최대 동시 접속', value: `${maxParticipants}명` },
          { label: '평균 참여자', value: `${avgParticipants}명` }
        ];

      default:
        return null;
    }
  }, [chartData, type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-lg border p-6 ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">실시간 업데이트</p>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <button
          onClick={() => {
            setLoading(true);
            // 데이터 재로드 로직
            setTimeout(() => setLoading(false), 1000);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <svg
            className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 통계 카드 */}
      {getStats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {getStats.map((stat, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 차트 */}
      <div style={{ height }}>
        {renderChart()}
      </div>
    </motion.div>
  );
}

export default ChartWidget;
