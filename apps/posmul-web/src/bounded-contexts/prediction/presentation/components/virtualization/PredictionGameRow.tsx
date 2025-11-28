"use client";

import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, TrendingUp, Play } from 'lucide-react';

export const PredictionGameRow = ({
  game,
  isLoading = false,
  isSelected = false,
  onSelect
}) => {
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount?.toLocaleString() || '0';
  };

  const formatTimeRemaining = (endTime) => {
    if (!endTime) return '시간 정보 없음';

    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return '종료됨';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 남음`;
    }

    return hours > 0 ? `${hours}시간 남음` : `${minutes}분 남음`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'ended': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 m-2 animate-pulse">
        <div className="flex space-x-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-300 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
          <div className="w-24 h-16 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 m-2 opacity-50">
        <div className="text-center text-gray-500">
          게임을 불러오는 중...
        </div>
      </div>
    );
  }

  const topOption = game.options?.[0];
  const secondOption = game.options?.[1];

  return (
    <motion.div
      whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect && onSelect(game)}
      className={`
        bg-white border rounded-lg p-4 m-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1 pr-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 flex-1">
              {game.title}
            </h3>
            <div
              className="px-2 py-1 rounded-full text-xs font-medium text-white ml-3"
              style={{ backgroundColor: getStatusColor(game.status) }}
            >
              {game.status === 'active' && '진행중'}
              {game.status === 'pending' && '대기중'}
              {game.status === 'ended' && '종료'}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {game.description}
          </p>

          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimeRemaining(game.endTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{game.totalParticipants || 0}명</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(game.totalPool || 0)} PMP</span>
            </div>
          </div>

          {/* Top Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[topOption, secondOption].filter(Boolean).map((option, index) => (
              <div
                key={option?.id || index}
                className="bg-gray-50 rounded-lg p-2 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {option?.text}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span
                      className="text-sm font-bold"
                      style={{ color: option?.color }}
                    >
                      {option?.probability}%
                    </span>
                    {option?.trend && (
                      <TrendingUp
                        className={`w-3 h-3 ${
                          option.trend === 'up' ? 'text-green-500' :
                          option.trend === 'down' ? 'text-red-500 rotate-180' :
                          'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: option?.color,
                      width: `${option?.probability || 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Action */}
        <div className="flex flex-col items-center space-y-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={game.status !== 'active'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            onClick={(e) => {
              e.stopPropagation();
              // 베팅 모달 열기 로직
            }}
          >
            <Play className="w-4 h-4" />
            <span>베팅</span>
          </motion.button>

          {game.gameImportanceScore && (
            <div className="text-xs text-center">
              <div className="text-gray-500">중요도</div>
              <div className="font-bold text-blue-600">
                {game.gameImportanceScore}/10
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
