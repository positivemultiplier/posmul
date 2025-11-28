"use client";

import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';

export const ConfidenceSlider = ({
  value,
  onChange,
  disabled = false
}) => {
  const confidencePresets = [10, 25, 50, 75, 90];

  const getConfidenceColor = (confidence) => {
    if (confidence <= 25) return '#ef4444'; // red
    if (confidence <= 50) return '#f59e0b'; // orange
    if (confidence <= 75) return '#10b981'; // green
    return '#3b82f6'; // blue
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence <= 25) return '낮은 신뢰도';
    if (confidence <= 50) return '보통 신뢰도';
    if (confidence <= 75) return '높은 신뢰도';
    return '매우 높은 신뢰도';
  };

  return (
    <div className="space-y-4">
      {/* 현재 신뢰도 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">신뢰도</span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className="text-2xl font-bold"
            style={{ color: getConfidenceColor(value) }}
          >
            {value}%
          </span>
          <span className="text-sm text-gray-500">
            {getConfidenceLabel(value)}
          </span>
        </div>
      </div>

      {/* 슬라이더 */}
      <div className="relative">
        <input
          type="range"
          min="10"
          max="95"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              #ef4444 0%,
              #f59e0b 25%,
              #10b981 50%,
              #3b82f6 75%,
              #8b5cf6 100%
            )`
          }}
        />
        <div
          className="absolute top-0 w-6 h-6 bg-white border-2 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${((value - 10) / 85) * 100}%`,
            borderColor: getConfidenceColor(value)
          }}
        />
      </div>

      {/* 프리셋 버튼들 */}
      <div className="flex space-x-2 justify-center">
        {confidencePresets.map((preset) => (
          <motion.button
            key={preset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(preset)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
              ${value === preset
                ? 'text-white shadow-md'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              backgroundColor: value === preset ? getConfidenceColor(preset) : undefined
            }}
          >
            {preset}%
          </motion.button>
        ))}
      </div>

      {/* 신뢰도 설명 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">신뢰도가 미치는 영향</span>
        </div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 높은 신뢰도: 더 많은 베팅, 더 높은 수익 가능성</li>
          <li>• 낮은 신뢰도: 적은 베팅, 안정적인 수익</li>
          <li>• 신뢰도에 따라 최종 베팅 금액이 자동 조정됩니다</li>
        </ul>
      </div>
    </div>
  );
};
