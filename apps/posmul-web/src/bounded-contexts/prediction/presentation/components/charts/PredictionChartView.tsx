"use client";

import React from 'react';
import { Card } from '../../../../../shared/ui/components/base';
import { ProbabilityLineChart } from './ProbabilityLineChart';
import { BettingDistributionChart } from './BettingDistributionChart';
import { ParticipantTimelineChart } from './ParticipantTimelineChart';
import { TrendingUp, Users, PieChart } from 'lucide-react';

export const PredictionChartView = ({
  gameId: _gameId,
  predictionType = 'BINARY', // BINARY, MULTIPLE_CHOICE, etc.
  probabilityData = [],
  bettingData = [],
  participantData = [],
  isLoading = false
}) => {
  // Mock data generation based on type
  const generateMockProbabilityData = () => {
    if (predictionType === 'BINARY') {
      return [
        { time: '09:00', optionA: 45, optionB: 55 },
        { time: '10:00', optionA: 48, optionB: 52 },
        { time: '11:00', optionA: 52, optionB: 48 },
        { time: '12:00', optionA: 58, optionB: 42 },
        { time: '13:00', optionA: 62, optionB: 38 },
        { time: '14:00', optionA: 55, optionB: 45 },
        { time: '15:00', optionA: 60, optionB: 40 },
      ];
    }
    // Default single line
    return [
      { time: '09:00', probability: 45, confidence: 0.8 },
      { time: '10:00', probability: 52, confidence: 0.82 },
      { time: '11:00', probability: 48, confidence: 0.85 },
      { time: '12:00', probability: 58, confidence: 0.87 },
      { time: '13:00', probability: 62, confidence: 0.89 },
      { time: '14:00', probability: 55, confidence: 0.84 },
      { time: '15:00', probability: 60, confidence: 0.91 },
    ];
  };

  const generateMockBettingData = () => {
    if (predictionType === 'BINARY') {
      return [
        { option: '승리/YES', amount: 125000, percentage: 62, color: '#3b82f6' },
        { option: '패배/NO', amount: 75000, percentage: 38, color: '#ef4444' },
      ];
    }
    return [
      { option: '옵션 A', amount: 125000, percentage: 62, color: '#3b82f6' },
      { option: '옵션 B', amount: 75000, percentage: 38, color: '#ef4444' },
    ];
  };

  const mockParticipantData = [
    { time: '09:00', count: 23, newParticipants: 5 },
    { time: '10:00', count: 35, newParticipants: 12 },
    { time: '11:00', count: 42, newParticipants: 7 },
    { time: '12:00', count: 58, newParticipants: 16 },
    { time: '13:00', count: 67, newParticipants: 9 },
    { time: '14:00', count: 73, newParticipants: 6 },
    { time: '15:00', count: 84, newParticipants: 11 },
  ];

  const currentProbabilityData = probabilityData.length > 0 ? probabilityData : generateMockProbabilityData();
  const currentBettingData = bettingData.length > 0 ? bettingData : generateMockBettingData();
  const currentParticipantData = participantData.length > 0 ? participantData : mockParticipantData;

  // Chart configuration based on type
  const getChartLines = () => {
    if (predictionType === 'BINARY') {
      return [
        { dataKey: 'optionA', name: '승리/YES', color: '#3b82f6', strokeWidth: 3 },
        { dataKey: 'optionB', name: '패배/NO', color: '#ef4444', strokeWidth: 3 },
      ];
    }
    return undefined; // Use default
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 차트 제목 섹션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📊 실시간 분석</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>실시간 업데이트</span>
          </div>
        </div>
      </div>

      {/* 메인 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 확률 변화 차트 */}
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">📈 확률 변화</h3>
          </div>
          <ProbabilityLineChart
            data={currentProbabilityData}
            lines={getChartLines()}
          />
          <div className="mt-4 text-sm text-gray-600">
            <p>• 시간별 예측 확률 변화 추이</p>
            <p>• 신뢰도 지수 포함 (투명도로 표시)</p>
          </div>
        </Card>

        {/* 베팅 분포 차트 */}
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">💰 베팅 분포</h3>
          </div>
          <BettingDistributionChart data={currentBettingData} />
          <div className="mt-4 space-y-2">
            {currentBettingData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium">{item.option}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{item.percentage}%</div>
                  <div className="text-gray-500">{item.amount.toLocaleString()}원</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 참여자 타임라인 차트 (전체 너비) */}
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">👥 참여자 타임라인</h3>
        </div>
        <ParticipantTimelineChart data={currentParticipantData} />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-bold text-blue-600 text-xl">
              {currentParticipantData[currentParticipantData.length - 1]?.count || 0}
            </div>
            <div className="text-blue-800">총 참여자</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-bold text-green-600 text-xl">
              {currentParticipantData.reduce((sum, item) => sum + item.newParticipants, 0)}
            </div>
            <div className="text-green-800">신규 참여자</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-bold text-purple-600 text-xl">
              {Math.round(
                currentParticipantData.reduce((sum, item) => sum + item.newParticipants, 0) /
                currentParticipantData.length
              )}
            </div>
            <div className="text-purple-800">시간당 평균</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="font-bold text-orange-600 text-xl">
              {currentParticipantData.length > 1 ? (
                ((currentParticipantData[currentParticipantData.length - 1].count -
                  currentParticipantData[0].count) /
                  currentParticipantData[0].count * 100).toFixed(1)
              ) : 0}%
            </div>
            <div className="text-orange-800">증가율</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
