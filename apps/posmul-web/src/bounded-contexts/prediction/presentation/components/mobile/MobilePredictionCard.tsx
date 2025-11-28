"use client";

import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, DollarSign, Play } from 'lucide-react';

export const MobilePredictionCard = ({
  game,
  onBetClick,
  onDetailsClick
}) => {
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const formatTimeRemaining = (endTime) => {
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

  const topOption = game.options?.[0] || {};
  const secondOption = game.options?.[1] || {};

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-3"
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1 pr-2">
            {game.title}
          </h3>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getStatusColor(game.status) }}
          >
            {game.status === 'active' && '진행중'}
            {game.status === 'pending' && '대기중'}
            {game.status === 'ended' && '종료'}
          </div>
        </div>

        {/* Time and participants */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRemaining(game.endTime)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{game.totalParticipants || 0}명</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3 h-3" />
            <span>{formatCurrency(game.totalPool || 0)} PMP</span>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-4 pb-3">
        <div className="space-y-2">
          {/* Top 2 options */}
          {[topOption, secondOption].filter(Boolean).map((option, index) => (
            <div
              key={option.id || index}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate pr-2">
                    {option.text}
                  </span>
                  <div className="flex items-center space-x-1 text-sm">
                    <span
                      className="font-bold"
                      style={{ color: option.color }}
                    >
                      {option.probability}%
                    </span>
                    {option.trend && (
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

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className="h-1 rounded-full"
                    style={{ backgroundColor: option.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${option.probability}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* More options indicator */}
          {game.options && game.options.length > 2 && (
            <div className="text-center">
              <span className="text-xs text-gray-500">
                +{game.options.length - 2}개 옵션 더보기
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onDetailsClick && onDetailsClick(game)}
          className="flex-1 py-3 px-4 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          자세히 보기
        </motion.button>
        <div className="w-px bg-gray-200" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onBetClick && onBetClick(game)}
          disabled={game.status !== 'active'}
          className="flex-1 py-3 px-4 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center space-x-1"
        >
          <Play className="w-4 h-4" />
          <span>베팅하기</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
